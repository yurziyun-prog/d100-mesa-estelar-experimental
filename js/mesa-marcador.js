// Mesa Estelar v163 — Marcador de áreas (mestre): transforma uma imagem (ex.: gerada por IA) em mapa jogável.
//
// Botão 🖌️ na barra de cima. Com o mapa aberto, o mestre:
//  1. marca áreas por cima da imagem: ▭ retângulo (arrastar), ⬠ polígono (cliques; duplo clique fecha), 🪄 varinha
//     (clica numa cor e pega a área parecida em volta), 👆 selecionar (muda etiqueta, nome, apaga, salva como peça);
//  2. escolhe a etiqueta: parede, rocha, móvel, água, porta, escada, teto, por cima (toldo/varal/galho), planta, tapete;
//  3. 🧽 apaga coisas da própria imagem (ex.: plantinhas a mais): arrasta sobre o que quer sumir e clica num chão limpo;
//  4. ✅ Aplicar: as marcas viram o mapa (paredes invisíveis, coisas por cima dos personagens, tetos que abrem…);
//  5. 💾 Salvar como peça: o pedaço marcado da imagem vira objeto do Banco (casa, escada, toldo…) para usar em outros mapas;
//  6. 🖼️ Novo mapa de uma imagem: envia a imagem e cria o mapa.
// As marcas ficam no próprio mapa (mapas/<id>.marcasV163). Nada muda para os jogadores até o mestre aplicar.

import {ETIQUETAS,ORDEM_ETIQUETAS,caixaDaMarca,contem,elementosDeMarcas,marcasAcima,retangulosDaGrade,bitsParaTexto,bitLigado,resumoMarcas} from './mesa-marcas.js?v=163';
import {estadoDeImagem,fundoDeImagem} from './mesa-mapa-ia.js?v=163';
import {cenaDoEstado,LIMITE_CENA} from './mesa-mapas-ui.js?v=141';
import {gerarMapa} from './mesa-gerador-mapas.js?v=163';

const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clean=v=>JSON.parse(JSON.stringify(v??null));
const DOC_MARCAS=id=>'combatesAtivos/marcasMapa_'+encodeURIComponent(id);
const SCENE='combatesAtivos/mapaMesaSyncDiretaCena',ARQ=id=>'combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(id);
const novoId=()=>'m'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
const slug=t=>String(t||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,40)||'peca';

// pixels marcados (varinha): preenchimento a partir de um ponto, cor parecida (distância RGB ≤ tol)
export function inundar(px,w,h,sx,sy,tol,raio=1e9){
 const i0=(sy*w+sx)*4,r0=px[i0],g0=px[i0+1],b0=px[i0+2],out=new Uint8Array(w*h),pilha=[sx+sy*w],t2=tol*tol,R2=raio*raio;
 while(pilha.length){const p=pilha.pop();if(out[p])continue;const k=p*4,dr=px[k]-r0,dg=px[k+1]-g0,db=px[k+2]-b0;if(dr*dr+dg*dg+db*db>t2)continue;
  const x=p%w,y=(p-x)/w;if((x-sx)*(x-sx)+(y-sy)*(y-sy)>R2)continue;out[p]=1;if(x>0)pilha.push(p-1);if(x<w-1)pilha.push(p+1);if(y>0)pilha.push(p-w);if(y<h-1)pilha.push(p+w);}
 return out;
}
// máscara de pixels → marca de células (passo em metros); k = pixels por metro
export function celulasDeMascara(mask,w,h,k,passo=.25){
 let x0=w,y0=h,x1=-1,y1=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(mask[y*w+x]){if(x<x0)x0=x;if(y<y0)y0=y;if(x>x1)x1=x;if(y>y1)y1=y;}
 if(x1<0)return null;
 const cp=passo*k,bx=Math.floor(x0/cp),by=Math.floor(y0/cp),cw=Math.ceil((x1+1)/cp)-bx,ch=Math.ceil((y1+1)/cp)-by,bits=new Uint8Array(cw*ch);
 for(let j=0;j<ch;j++)for(let i=0;i<cw;i++){let n=0,t=0;for(let y=Math.floor((by+j)*cp);y<Math.min(h,Math.floor((by+j+1)*cp));y++)for(let x=Math.floor((bx+i)*cp);x<Math.min(w,Math.floor((bx+i+1)*cp));x++){t++;n+=mask[y*w+x];}if(t&&n/t>=.55)bits[j*cw+i]=1;}
 return {x:+(bx*passo).toFixed(3),y:+(by*passo).toFixed(3),w:cw,h:ch,passo,bits:bitsParaTexto(bits)};
}

// v174: quanto de uma marca ainda está valendo no mapa (0..1), pelas caixas que estão na cena. O que o mestre apagou
// no 🛠️ (parede, escada, terraço) some também das marcas — senão o ✅ Aplicar traz de volta.
export function cobertura(marca,caixas,passo=.5){
 const b=caixaDaMarca(marca);let n=0,c=0;
 for(let y=b.y+passo/2;y<b.y+b.h;y+=passo)for(let x=b.x+passo/2;x<b.x+b.w;x+=passo){if(!contem(marca,x,y))continue;n++;if(caixas.some(q=>x>=q.x-.05&&x<=q.x+q.w+.05&&y>=q.y-.05&&y<=q.y+q.h+.05))c++;}
 return n?c/n:1;
}
export const TIPOS_RECONCILIAR=['parede','rocha','terraco','movel','escada'];
// pedaços (retângulos) de uma marca que não estão mais cobertos — viram passagens (marca "porta", que abre a parede)
export function buracos(marca,caixas,passo=.5){
 const b=caixaDaMarca(marca),linhas=[];
 for(let y=b.y;y<b.y+b.h-1e-6;y+=passo){const run=[];let ini=null;
  for(let x=b.x;x<b.x+b.w+1e-6;x+=passo){const cx=x+passo/2,cy=y+passo/2;const livre=x<b.x+b.w-1e-6&&contem(marca,cx,cy)&&!caixas.some(q=>cx>=q.x-.05&&cx<=q.x+q.w+.05&&cy>=q.y-.05&&cy<=q.y+q.h+.05);
   if(livre&&ini===null)ini=x;if(!livre&&ini!==null){run.push([ini,x]);ini=null;}}
  linhas.push({y,run});}
 const out=[];
 for(const {y,run} of linhas)for(const [x0,x1] of run){const ant=out.find(r=>Math.abs(r.x-x0)<1e-6&&Math.abs(r.x+r.w-x1)<1e-6&&Math.abs(r.y+r.h-y)<1e-6);if(ant)ant.h+=passo;else out.push({x:x0,y,w:x1-x0,h:passo});}
 return out.map(r=>({x:+r.x.toFixed(2),y:+r.y.toFixed(2),w:+r.w.toFixed(2),h:+r.h.toFixed(2)}));
}
export function instalarMarcador(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const D=p=>dep.doc(dep.db,p);
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const uid=()=>{try{return String(dep.uid?.()||'');}catch(_){return '';}};
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 const mapas=()=>{try{return dep.mapas?.()||[];}catch(_){return [];}};
 const board=()=>root.getElementById('novaSyncBoard');
 const toast=(t,ms=6000)=>{const n=root.createElement('div');n.textContent=t;n.style.cssText='position:fixed;left:50%;top:84px;transform:translateX(-50%);z-index:10000;background:#1d2a44;border:1px solid #8ee7ff;color:#e8eefc;padding:8px 14px;border-radius:12px;font:600 13px Segoe UI,Arial,sans-serif;max-width:560px';root.body.append(n);setTimeout(()=>n.remove(),ms);};

 let sincronizado=false,pendente=false,origemMarcas='',cenaVista=null,verColisao=false,aberto=false,painel=null,svg=null,botao=null,mapId='',W=28,H=14,marcas=[],desfazer=[],etiqueta='parede',ferramenta='ret',sel=null,tol=40,alcance=4,mostrar=true;
 let rasc=null,poli=[],fundo={src:'',img:null,k:32,tela:null,px:null,alterada:false},apagar=null,ocupado=false;

 // ------------------------------------------------------------ estilo
 const CSS=`#mkPainel{position:fixed;z-index:9004;left:16px;top:96px;width:300px;max-height:82vh;overflow:auto;padding:10px;border-radius:12px;background:rgba(9,15,29,.97);border:1px solid #20c997;color:#e8eefc;font:13px 'Segoe UI',Arial,sans-serif;box-shadow:0 10px 28px rgba(0,0,0,.55)}
#mkPainel[hidden]{display:none}#mkPainel h3{margin:0 0 6px;color:#63e6be;font-size:14px;display:flex;gap:6px;align-items:center;cursor:move}#mkPainel h3 span{flex:1}
#mkPainel .mk-g{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0}#mkPainel button{min-height:30px;padding:2px 8px;border-radius:8px;border:1px solid #2f4664;background:#16233a;color:#e8eefc;cursor:pointer;font:12px 'Segoe UI',Arial,sans-serif}
#mkPainel button[aria-pressed=true]{border-color:#63e6be;background:#0f3b33}#mkPainel button:disabled{opacity:.45;cursor:not-allowed}
#mkPainel .mk-et{display:grid;grid-template-columns:1fr 1fr;gap:4px}#mkPainel .mk-et button{text-align:left;display:flex;gap:5px;align-items:center}
#mkPainel .mk-et i{display:inline-block;width:10px;height:10px;border-radius:3px;flex:0 0 auto}
#mkPainel .mk-s{margin:8px 0;padding:8px;border-radius:9px;background:rgba(255,255,255,.04);border:1px solid #2a3c58}
#mkPainel small,#mkPainel .mk-dica{color:#9fb3cc}#mkPainel input[type=text],#mkPainel input[type=number],#mkPainel select{width:100%;box-sizing:border-box;margin:3px 0;padding:4px 7px;border-radius:7px;border:1px solid #3b5878;background:#0e1626;color:#e8eefc}
#mkPainel .mk-st{color:#ffe9a8;min-height:18px;margin:4px 0}
#mkSvg{position:absolute;left:0;top:0;width:100%;height:100%;z-index:35;touch-action:none}#mkSvg.mk-off{pointer-events:none}
#mkSvg .mk-m{stroke-width:.08;fill-opacity:.32;vector-effect:non-scaling-stroke}#mkSvg .mk-m.mk-sel{fill-opacity:.55;stroke:#fff!important;stroke-width:3;stroke-dasharray:6 3}
#mkBotao{min-width:34px;height:32px;border-radius:9px;border:1px solid #63e6be;background:rgba(6,32,26,.94);color:#c3fae8;cursor:pointer;font-size:16px}`;
 if(!root.getElementById('mkCss')){const st=root.createElement('style');st.id='mkCss';st.textContent=CSS;root.head.append(st);}

 // ------------------------------------------------------------ dados do mapa
 const registro=()=>mapas().find(m=>String(m.id)===mapId)||null;
 async function cenaAtual(){
  try{const c=ctl()?.cenaAtual?.();if(c&&String(c.mapId||'')===mapId)return c;}catch(_){}
  for(const p of [ARQ(mapId),SCENE]){try{const s=await dep.getDoc(D(p));if(s.exists()&&String(s.data()?.mapId||'')===mapId)return s.data();}catch(_){}}
  return null;
 }
 const ehFundo=o=>!!(o?.oficinaElement?.fundoV161||o?.fundoV161||/^pintura do ch[aã]o$/i.test(String(o?.nome||'')));
 function srcDoFundo(cena){const o=(cena?.objects||[]).find(ehFundo);return String(o?.oficinaElement?.src||o?.imagem||o?.src||'');}
 // marcas a partir do que está valendo no mapa (paredes invisíveis, obstáculos, escadas, terraços)
 function marcasDaCena(cena,Wm,Hm){
  const out=[];let n=0;const ce=o=>o?.oficinaElement||{};
  for(const o of cena?.objects||[]){const e=ce(o);if(!(e.marcaV163||e.invisivelV161))continue;
   const w=Number(o.larguraM)||Number(e.w)||1,h=Number(o.alturaM)||Number(e.h)||1,x=Number(o.x)*Wm/28-w/2,y=Number(o.y)*Hm/14-h/2;const r={forma:'ret',x:+x.toFixed(2),y:+y.toFixed(2),w:+w.toFixed(2),h:+h.toFixed(2)};
   let tipo='';if(e.pisoAndarV144>1)tipo='terraco';else if(e.escadaAndarV144||/^escada/i.test(o.nome||''))tipo='escada';else if(Number(e.andarV144)>1)continue;
   else if(o.bloqueiaMovimento&&(e.bloqueiaVisao??o.bloqueiaVisao)!==false)tipo=/rocha|pared[aã]o|rochedo/i.test(o.nome||'')?'rocha':'parede';else if(o.bloqueiaMovimento||e.bloqueiaMovimento)tipo='movel';else continue;
   out.push({id:'c'+(n++).toString(36),tipo,...r});}
  // paredes debaixo de um terraço já vêm com ele
  const ts=out.filter(m=>m.tipo==='terraco');return out.filter(m=>!(m.tipo==='parede'&&ts.some(t=>m.x>=t.x-.3&&m.y>=t.y-.3&&m.x+m.w<=t.x+t.w+.3&&m.y+m.h<=t.y+t.h+.3)));
 }
 // junta às marcas as colisões do mapa que ainda não têm marca igual (mesma caixa); devolve quantas entraram
 function juntarDaCena(cena){
  const novas=marcasDaCena(cena,W,H),igual=(a,b)=>{const p=caixaDaMarca(a),q=caixaDaMarca(b);return a.tipo===b.tipo&&Math.abs(p.x-q.x)<.3&&Math.abs(p.y-q.y)<.3&&Math.abs(p.w-q.w)<.3&&Math.abs(p.h-q.h)<.3;};
  const bloqTipos=['parede','rocha','terraco','movel','agua','escada'],cobre=(n)=>marcas.some(k=>bloqTipos.includes(k.tipo)&&(()=>{const p=caixaDaMarca(k),q=caixaDaMarca(n);return q.x>=p.x-.3&&q.y>=p.y-.3&&q.x+q.w<=p.x+p.w+.3&&q.y+q.h<=p.y+p.h+.3;})());
  const faltam=novas.filter(n=>!marcas.some(k=>igual(k,n))&&!cobre(n)).map((n,i)=>({...n,id:'c'+Date.now().toString(36)+i.toString(36)}));
  if(faltam.length)marcas=[...faltam,...marcas];return faltam.length;
 }
 // v174: o que o mestre apagou no 🛠️ (paredes, escadas, terraços, obstáculos) também sai das marcas; parede apagada só num
 // pedaço vira passagem ("porta" na marca). Senão o ✅ Aplicar traria tudo de volta.
 function reconciliar(cena){
  const ce=o=>o?.oficinaElement||{},mk=(cena?.objects||[]).filter(o=>{const e=ce(o);return e.marcaV163||e.invisivelV161||o.marcaV163||o.invisivelV161;});if(!mk.length)return 0;
  const cx=o=>{const e=ce(o),w=Number(o.larguraM)||Number(e.w)||1,h=Number(o.alturaM)||Number(e.h)||1;return {x:Number(o.x)*W/28-w/2,y:Number(o.y)*H/14-h/2,w,h};};
  const andar=o=>Number(ce(o).andarV144??o.andarV144??1);
  const chao=mk.filter(o=>o.bloqueiaMovimento&&andar(o)<=1).map(cx),pisos=mk.filter(o=>Number(ce(o).pisoAndarV144||o.pisoAndarV144||0)>1).map(cx),escadas=mk.filter(o=>ce(o).escadaAndarV144||/^escada/i.test(String(o.nome||''))).map(cx);
  let mud=0;const novas=[];
  for(const m of marcas){
   if(!TIPOS_RECONCILIAR.includes(m.tipo)){novas.push(m);continue;}
   if(m.tipo==='escada'){if(cobertura(m,escadas)<.4){mud++;continue;}novas.push(m);continue;}
   if(m.tipo==='terraco'&&pisos.length&&cobertura(m,pisos)<.4){mud++;continue;}
   const c=cobertura(m,chao);
   if(m.tipo!=='terraco'&&c<.4){mud++;continue;}
   novas.push(m);
   if(c<.97&&chao.length){for(const r of buracos(m,chao)){if(r.w*r.h<.2)continue;const ja=marcas.some(k=>k.tipo==='porta'&&Math.abs(k.x-r.x)<.1&&Math.abs(k.y-r.y)<.1&&Math.abs(k.w-r.w)<.1&&Math.abs(k.h-r.h)<.1);if(ja)continue;novas.push({id:'p174'+Date.now().toString(36)+novas.length.toString(36),tipo:'porta',forma:'ret',...r,nome:'Passagem aberta no 🛠️'});mud++;}}
  }
  if(mud)marcas=novas;return mud;
 }
 async function carregar(){
  mapId=String(ctl()?.mapaAtual?.()||'');const r=registro();
  try{const d=ctl()?.dimsAtual?.();W=Number(d?.W)||Number(r?.larguraM)||28;H=Number(d?.H)||Number(r?.alturaM)||14;}catch(_){W=Number(r?.larguraM)||28;H=Number(r?.alturaM)||14;}
  // v166: as marcas ficam num documento só delas (o mapa às vezes é regravado sem elas); antes, no próprio mapa
  marcas=null;origemMarcas='';
  sincronizado=false;pendente=false;
  try{const s=await dep.getDoc(D(DOC_MARCAS(mapId)));const j=s.exists()?s.data()?.json:'';if(j){marcas=JSON.parse(j);origemMarcas='doc';sincronizado=!!s.data()?.sincronizadoV167;}}catch(_){}
  if(!marcas&&Array.isArray(r?.marcasV163)&&r.marcasV163.length){marcas=clean(r.marcasV163);origemMarcas='mapa';}
  if(!marcas){try{const s=await dep.getDoc(D('mapas/'+mapId));const v=s.exists()?s.data()?.marcasV163:null;if(Array.isArray(v)&&v.length){marcas=clean(v);origemMarcas='mapa';}}catch(_){}}
  desfazer=[];sel=null;poli=[];rasc=null;apagar=null;
  const cena=await cenaAtual();cenaVista=cena;
  if(!marcas){marcas=marcasDaCena(cena,W,H);origemMarcas=marcas.length?'cena':'';}
  // v167: tem paredes valendo no mapa que não estão nas marcas (ex.: só uma marca desenhada à mão) → junta tudo, senão não dá para selecionar
  else if(!sincronizado){const n=juntarDaCena(cena);if(n)origemMarcas='cena';if(reconciliar(cena))guardar(true);}
  // v174: marca cujo pedaço no mapa o mestre apagou no 🛠️ sai das marcas
  else if(cena?.objects?.length){const n=reconciliar(cena);if(n)guardar(true);}
  if(!sincronizado&&marcas.length){sincronizado=true;guardar(true);} // daqui em diante as marcas mandam: o que você tirar não volta
  const src=srcDoFundo(cena)||String(r?.imagemV163?.src||'');
  fundo={src,img:null,k:32,tela:null,px:null,alterada:false};
  if(src)await carregarImagem(src).catch(e=>{console.warn('[Marcador] imagem',e);estado('⚠️ Não consegui ler a imagem de fundo (a varinha e a borracha não vão funcionar).');});
  if(origemMarcas==='cena')estado(`As paredes, escadas e terraços que estão valendo no mapa viraram marcas (${marcas.length} ao todo): 👆 Selecionar, clique numa, arraste para mover, puxe os cantos, 🗑️ tira. Depois ✅ Aplicar.`);
  desenhar();desenharPainel();
 }
 function carregarImagem(src){
  return new Promise((res,rej)=>{const i=new Image();i.crossOrigin='anonymous';i.onload=()=>{try{
   const c=root.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(i,0,0);
   fundo.img=i;fundo.tela=c;fundo.k=i.naturalWidth/W;fundo.px=g.getImageData(0,0,c.width,c.height).data;res();}catch(e){rej(e);}};i.onerror=()=>rej(Error('imagem'));i.src=src;});
 }
 let salvarT=null;
 function guardar(semMudanca=false){if(!semMudanca){pendente=true;const b=painel?.querySelector('[data-aplica]');if(b)b.textContent='✅ Aplicar no mapa (há mudanças)';}clearTimeout(salvarT);salvarT=setTimeout(async()=>{try{await dep.setDoc(D(DOC_MARCAS(mapId)),{json:JSON.stringify(marcas),mapId,em:Date.now(),sincronizadoV167:sincronizado});const r=registro();if(r)r.marcasV163=clean(marcas);}catch(e){console.warn('[Marcador] salvar',e);estado('⚠️ Não salvou as marcas: '+(e?.message||e));}},600);}
 function mudar(fn){desfazer.push(JSON.stringify(marcas));if(desfazer.length>60)desfazer.shift();fn();guardar();desenhar();desenharPainel();}

 // ------------------------------------------------------------ desenho das marcas (SVG por cima do mapa)
 function garantirSvg(){
  const b=board();if(!b)return null;
  if(!svg||svg.parentElement!==b){svg?.remove();svg=root.createElementNS('http://www.w3.org/2000/svg','svg');svg.id='mkSvg';svg.setAttribute('preserveAspectRatio','none');b.append(svg);
   svg.addEventListener('pointerdown',aoPressionar,true);svg.addEventListener('pointermove',aoMover);svg.addEventListener('pointerup',aoSoltar);svg.addEventListener('dblclick',e=>{e.stopPropagation();e.preventDefault();fecharPoli();});
   svg.addEventListener('click',e=>{e.stopPropagation();});}
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.classList.toggle('mk-off',!aberto);return svg;
 }
 function formaSvg(m,classe=''){
  const E=ETIQUETAS[m.tipo]||ETIQUETAS.parede,a=`class="mk-m ${classe}" data-id="${esc(m.id||'')}" fill="${E.cor}" stroke="${E.cor}"`;
  if(m.forma==='poli')return `<polygon ${a} points="${(m.pts||[]).map(p=>p.join(',')).join(' ')}"/>`;
  if(m.forma==='celulas'&&m.celulas){const c=m.celulas,g=new Uint8Array(c.w*c.h);for(let i=0;i<g.length;i++)g[i]=bitLigado(c.bits,i)?1:0;
   const rs=retangulosDaGrade({g,cw:c.w,ch:c.h,passo:c.passo});return `<path ${a} d="${rs.map(r=>`M${(c.x+r.x).toFixed(2)} ${(c.y+r.y).toFixed(2)}h${r.w}v${r.h}h${-r.w}z`).join('')}"/>`;}
  const b=caixaDaMarca(m);return `<rect ${a} x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}"/>`;
 }
 function desenhar(){
  const s=garantirSvg();if(!s)return;
  let h='';
  if(aberto&&fundo.alterada&&fundo.tela)h+=`<image href="${fundo.previa||''}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="none"/>`;
  if(aberto&&verColisao)h+=colisaoSvg();
  if(aberto&&mostrar)h+=marcas.map(m=>formaSvg(m,sel===m.id?'mk-sel':'')).join('');
  {const ms=aberto&&mostrar&&marcas.find(k=>k.id===sel);if(ms){const b=caixaDaMarca(ms),r=Math.max(.18,W/180);if(ms.forma==='ret')for(const [cx,cy] of [[b.x,b.y],[b.x+b.w,b.y],[b.x,b.y+b.h],[b.x+b.w,b.y+b.h]])h+=`<rect x="${cx-r}" y="${cy-r}" width="${r*2}" height="${r*2}" fill="#fff" stroke="#111" stroke-width="1" vector-effect="non-scaling-stroke"/>`;}}
  if(aberto&&rasc)h+=`<rect x="${Math.min(rasc.x0,rasc.x1)}" y="${Math.min(rasc.y0,rasc.y1)}" width="${Math.abs(rasc.x1-rasc.x0)}" height="${Math.abs(rasc.y1-rasc.y0)}" fill="${ferramenta==='apagar'?'#ff6b6b':(ETIQUETAS[etiqueta]?.cor||'#fff')}" fill-opacity=".25" stroke="#fff" stroke-width=".06" stroke-dasharray=".3 .2"/>`;
  if(aberto&&poli.length)h+=`<polyline points="${poli.map(p=>p.join(',')).join(' ')}" fill="${ETIQUETAS[etiqueta]?.cor}" fill-opacity=".2" stroke="#fff" stroke-width=".07"/>`+poli.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r=".15" fill="#fff"/>`).join('');
  if(aberto&&apagar?.alvo){const a=apagar.alvo;h+=`<rect x="${a.x}" y="${a.y}" width="${a.w}" height="${a.h}" fill="#ff6b6b" fill-opacity=".3" stroke="#ff6b6b" stroke-width=".08"/>`;}
  s.innerHTML=h;s.classList.toggle('mk-off',!aberto);
 }
 // v166: o que está valendo AGORA no mapa (não as marcas): vermelho barra a rua, roxo tracejado é o 2º andar, amarelo é escada
 function colisaoSvg(){
  const c=ctl()?.cenaAtual?.();const objs=(c&&String(c.mapId||'')===mapId?c.objects:cenaVista?.objects)||[];let h='';
  for(const o of objs){const e=o.oficinaElement||{},w=Number(o.larguraM)||1,hh=Number(o.alturaM)||1,x=Number(o.x)*W/28-w/2,y=Number(o.y)*H/14-hh/2;
   const esc=e.escadaAndarV144||/^escada/i.test(o.nome||''),a2=Number(e.andarV144||o.andarV144)>1;
   if(esc)h+=`<rect x="${x}" y="${y}" width="${w}" height="${hh}" fill="#fcc419" fill-opacity=".35" stroke="#fcc419" stroke-width="2" vector-effect="non-scaling-stroke"/>`;
   else if(o.bloqueiaMovimento&&!o.destruido&&!a2)h+=`<rect x="${x}" y="${y}" width="${w}" height="${hh}" fill="#ff1744" fill-opacity=".28" stroke="#ff1744" stroke-width="1.5" vector-effect="non-scaling-stroke"><title>${esc2(o.nome||'')}</title></rect>`;
   else if(e.pisoAndarV144>1)h+=`<rect x="${x}" y="${y}" width="${w}" height="${hh}" fill="none" stroke="#cc5de8" stroke-width="2" stroke-dasharray="6 4" vector-effect="non-scaling-stroke"/>`;}
  return h;
 }
 const esc2=t=>String(t).replace(/[<&]/g,'');
 const ponto=e=>{const r=svg.getBoundingClientRect();return [Math.max(0,Math.min(W,(e.clientX-r.left)/r.width*W)),Math.max(0,Math.min(H,(e.clientY-r.top)/r.height*H))];};
 const parar=e=>{e.stopPropagation();e.preventDefault();};

 // ------------------------------------------------------------ ferramentas
 function aoPressionar(e){
  if(!aberto||e.button!==0)return;parar(e);const [x,y]=ponto(e);
  if(ferramenta==='sel'){
   // v167: arrastar a marca selecionada move; puxar um canto (marca retangular) muda o tamanho
   const ms=marcas.find(k=>k.id===sel);
   if(ms){const b=caixaDaMarca(ms),tol=Math.max(.35,W/90),cantos=ms.forma==='ret'?[[b.x,b.y,'nw'],[b.x+b.w,b.y,'ne'],[b.x,b.y+b.h,'sw'],[b.x+b.w,b.y+b.h,'se']]:[];
    const c=cantos.find(([cx,cy])=>Math.abs(cx-x)<tol&&Math.abs(cy-y)<tol);
    if(c||contem(ms,x,y)){arrasto={id:ms.id,modo:c?c[2]:'mover',x0:x,y0:y,orig:clean(ms),antes:JSON.stringify(marcas)};svg.setPointerCapture?.(e.pointerId);return;}}
   let m=[...marcas].reverse().find(m=>contem(m,x,y));
   // v167: clicou numa colisão do mapa que ainda não virou marca → traz as colisões do mapa para as marcas e seleciona
   if(!m&&!sincronizado){const antes=JSON.stringify(marcas),n=juntarDaCena(cenaVista);sincronizado=true;if(n){desfazer.push(antes);guardar();m=[...marcas].reverse().find(k=>contem(k,x,y));estado(`📥 ${n} colisões do mapa viraram marcas. Agora dá para selecionar, mudar e tirar.`);}}
   sel=m?.id||null;if(m&&!mostrar)mostrar=true;desenhar();desenharPainel();return;}
  if(ferramenta==='ret'||(ferramenta==='apagar'&&!apagar?.alvo)){rasc={x0:x,y0:y,x1:x,y1:y};svg.setPointerCapture?.(e.pointerId);return;}
  if(ferramenta==='apagar'&&apagar?.alvo){copiarChao(x,y);return;}
  if(ferramenta==='poli'){if(poli.length>2&&Math.hypot(poli[0][0]-x,poli[0][1]-y)<.35){fecharPoli();return;}poli.push([+x.toFixed(2),+y.toFixed(2)]);desenhar();estado('Clique nos cantos; duplo clique (ou no 1º ponto) fecha. Esc cancela.');return;}
  if(ferramenta==='varinha'){varinha(x,y);return;}
 }
 let arrasto=null;
 function moverMarca(m,o,dx,dy,modo){
  if(modo==='mover'){if(o.forma==='poli')m.pts=o.pts.map(([px,py])=>[+(px+dx).toFixed(2),+(py+dy).toFixed(2)]);else if(o.forma==='celulas')m.celulas={...o.celulas,x:+(o.celulas.x+dx).toFixed(3),y:+(o.celulas.y+dy).toFixed(3)};else{m.x=+(o.x+dx).toFixed(2);m.y=+(o.y+dy).toFixed(2);}return;}
  let x0=o.x,y0=o.y,x1=o.x+o.w,y1=o.y+o.h;if(modo.includes('w'))x0+=dx;if(modo.includes('e'))x1+=dx;if(modo.includes('n'))y0+=dy;if(modo.includes('s'))y1+=dy;
  m.x=+Math.min(x0,x1).toFixed(2);m.y=+Math.min(y0,y1).toFixed(2);m.w=+Math.max(.15,Math.abs(x1-x0)).toFixed(2);m.h=+Math.max(.15,Math.abs(y1-y0)).toFixed(2);
 }
 function aoMover(e){
  if(arrasto){parar(e);const [x,y]=ponto(e),m=marcas.find(k=>k.id===arrasto.id);if(m){moverMarca(m,arrasto.orig,x-arrasto.x0,y-arrasto.y0,arrasto.modo);arrasto.mexeu=true;desenhar();}return;}
  if(!rasc)return;parar(e);const [x,y]=ponto(e);rasc.x1=x;rasc.y1=y;desenhar();}
 function aoSoltar(e){
  if(arrasto){parar(e);const a=arrasto;arrasto=null;if(a.mexeu){desfazer.push(a.antes);if(desfazer.length>60)desfazer.shift();guardar();desenhar();desenharPainel();estado('Marca ajustada. Clique ✅ Aplicar no mapa para valer no jogo.');}return;}
  if(!rasc)return;parar(e);const r={x:+Math.min(rasc.x0,rasc.x1).toFixed(2),y:+Math.min(rasc.y0,rasc.y1).toFixed(2),w:+Math.abs(rasc.x1-rasc.x0).toFixed(2),h:+Math.abs(rasc.y1-rasc.y0).toFixed(2)};rasc=null;
  if(r.w<.15||r.h<.15){desenhar();return;}
  if(ferramenta==='apagar'){apagar={alvo:r};estado('Agora clique num lugar de chão limpo do mesmo tamanho: ele é copiado por cima.');desenhar();return;}
  const m={id:novoId(),tipo:etiqueta,forma:'ret',...r};mudar(()=>{marcas.push(m);sel=m.id;});
 }
 function fecharPoli(){if(poli.length<3){poli=[];desenhar();return;}const m={id:novoId(),tipo:etiqueta,forma:'poli',pts:poli};poli=[];mudar(()=>{marcas.push(m);sel=m.id;});estado('');}
 function varinha(x,y){
  if(!fundo.px){estado('⚠️ Sem a imagem de fundo carregada.');return;}
  // trabalha numa cópia reduzida (8 px por metro) para ser rápido
  const k=8,w=Math.round(W*k),h=Math.round(H*k),c=root.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d',{willReadFrequently:true});g.filter='blur(1.5px)';g.drawImage(fundo.tela,0,0,w,h);g.filter='none'; // borrar um pouco: texturas (telhas, lajes) contam como uma cor só
  const px=g.getImageData(0,0,w,h).data,mask=inundar(px,w,h,Math.min(w-1,Math.floor(x*k)),Math.min(h-1,Math.floor(y*k)),tol,alcance*k);
  let n=0;for(const v of mask)n+=v;if(n>w*h*.35){estado('A área pegou quase o mapa todo: diminua a tolerância.');return;}
  const cel=celulasDeMascara(mask,w,h,k,.25);if(!cel)return;
  const m={id:novoId(),tipo:etiqueta,forma:'celulas',celulas:cel};mudar(()=>{marcas.push(m);sel=m.id;});
  estado(`🪄 ${(n/(k*k)).toFixed(1)} m² marcados como ${ETIQUETAS[etiqueta].nome}. Mexa na tolerância se pegou de mais ou de menos.`);
 }
 // borracha: copia um pedaço de chão limpo (do mesmo tamanho) por cima da área escolhida, com a borda suave
 function copiarChao(cx,cy){
  if(!fundo.tela){estado('⚠️ Sem a imagem de fundo carregada.');apagar=null;return;}
  const a=apagar.alvo,k=fundo.k,sx=Math.round((cx-a.w/2)*k),sy=Math.round((cy-a.h/2)*k),tx=Math.round(a.x*k),ty=Math.round(a.y*k),tw=Math.max(1,Math.round(a.w*k)),th=Math.max(1,Math.round(a.h*k));
  const tmp=root.createElement('canvas');tmp.width=tw;tmp.height=th;const g=tmp.getContext('2d');g.drawImage(fundo.tela,sx,sy,tw,th,0,0,tw,th);
  const borda=Math.max(2,Math.round(Math.min(tw,th)*.12));const msk=root.createElement('canvas');msk.width=tw;msk.height=th;const gm=msk.getContext('2d');gm.filter=`blur(${borda/2}px)`;gm.fillStyle='#000';gm.fillRect(borda,borda,tw-borda*2,th-borda*2);
  g.globalCompositeOperation='destination-in';g.drawImage(msk,0,0);
  if(!fundo.original){fundo.original=root.createElement('canvas');fundo.original.width=fundo.tela.width;fundo.original.height=fundo.tela.height;fundo.original.getContext('2d').drawImage(fundo.tela,0,0);}
  fundo.tela.getContext('2d').drawImage(tmp,tx,ty);fundo.alterada=true;fundo.previa=fundo.tela.toDataURL('image/jpeg',.8);
  try{fundo.px=fundo.tela.getContext('2d',{willReadFrequently:true}).getImageData(0,0,fundo.tela.width,fundo.tela.height).data;}catch(_){}
  apagar=null;estado('🧽 Apagado (só na sua tela). Pode apagar mais; para valer no jogo, clique "Salvar imagem".');desenhar();desenharPainel();
 }

 // ------------------------------------------------------------ envio de imagens
 async function enviar(blob,tipo,nome){
  const h=await crypto.subtle.digest('SHA-256',await blob.arrayBuffer());const hx=[...new Uint8Array(h)].slice(0,8).map(b=>b.toString(16).padStart(2,'0')).join('');
  const snap=await dep.uploadBytes(dep.ref(dep.storage,`personagens/${uid()}/mapas-imagem/${slug(nome)}-${hx}.${tipo==='image/webp'?'webp':'png'}`),blob,{contentType:tipo,cacheControl:'public,max-age=31536000,immutable'});
  return await dep.getDownloadURL(snap.ref);
 }
 async function paraBlob(c,alfa=false){let b=await new Promise(r=>c.toBlob(r,'image/webp',alfa?.9:.86));let t='image/webp';if(!b||b.type!=='image/webp'){b=await new Promise(r=>c.toBlob(r,'image/png'));t='image/png';}return {blob:b,tipo:t};}
 // recorte da imagem com o formato das marcas (o resto transparente); caixa em metros (ou o mapa todo)
 function recorte(lista,caixa=null){
  const k=fundo.k,b=caixa||{x:0,y:0,w:W,h:H},cw=Math.max(1,Math.round(b.w*k)),ch=Math.max(1,Math.round(b.h*k));
  const c=root.createElement('canvas');c.width=cw;c.height=ch;const g=c.getContext('2d');
  const m=root.createElement('canvas');m.width=cw;m.height=ch;const gm=m.getContext('2d');gm.fillStyle='#000';
  for(const mk of lista){
   if(mk.forma==='poli'){gm.beginPath();(mk.pts||[]).forEach(([x,y],i)=>{const X=(x-b.x)*k,Y=(y-b.y)*k;i?gm.lineTo(X,Y):gm.moveTo(X,Y);});gm.closePath();gm.fill();}
   else if(mk.forma==='celulas'&&mk.celulas){const q=mk.celulas;for(let j=0;j<q.h;j++)for(let i=0;i<q.w;i++)if(bitLigado(q.bits,j*q.w+i))gm.fillRect((q.x+i*q.passo-b.x)*k,(q.y+j*q.passo-b.y)*k,q.passo*k+1,q.passo*k+1);}
   else{const r=caixaDaMarca(mk);gm.fillRect((r.x-b.x)*k,(r.y-b.y)*k,r.w*k,r.h*k);}
  }
  g.filter='blur(1px)';g.drawImage(m,0,0);g.filter='none';g.globalCompositeOperation='source-in';g.drawImage(fundo.tela,b.x*k,b.y*k,cw,ch,0,0,cw,ch);
  return c;
 }

 // ------------------------------------------------------------ aplicar no mapa
 async function aplicar(){
  if(ocupado)return;if(!fundo.tela){estado('⚠️ Sem a imagem de fundo: não dá para aplicar.');return;}
  ocupado=true;desenharPainel();estado('⏳ Aplicando… (enviando os recortes)');
  try{
   if(fundo.alterada)await salvarImagem(false);
   const acimas=marcasAcima(marcas);let acimaSrc='';
   if(acimas.length){const {blob,tipo}=await paraBlob(recorte(acimas),true);acimaSrc=await enviar(blob,tipo,mapId+'-por-cima');}
   const tetos={};for(const m of marcas.filter(m=>m.tipo==='teto')){const {blob,tipo}=await paraBlob(recorte([m],caixaDaMarca(m)),true);tetos[m.id]={src:await enviar(blob,tipo,mapId+'-teto')};}
   const els=elementosDeMarcas(marcas,{W,H,acimaSrc,tetos});
   const novos=cenaDoEstado({w:W,h:H,ppm:Math.round(fundo.k),bg:'#c49a52',texture:'nenhuma',showGrid:false,grid:'#9a8a6a',name:'',formatoObjetos:'refs-v1',elements:els},mapId).objects||[];
   const cena=await cenaAtual();if(!cena)throw Error('Não achei a cena deste mapa.');
   const semAcima=!acimas.length,ehAcimaObj=o=>!!(o?.oficinaElement?.acimaV163||/^img:mk163:acima/.test(String(o?.oficinaElement?.id||'')));
   const ehMarca=o=>!(semAcima&&ehAcimaObj(o))&&!!(o?.oficinaElement?.marcaV163||o?.marcaV163||/^img:mk163:(acima|teto)/.test(String(o?.oficinaElement?.id||''))); // sem marcas "por cima", a camada por cima que já existe fica
   const mantidos=(cena.objects||[]).filter(o=>!ehMarca(o));
   const nova={...cena,mapId,objects:[...mantidos,...novos],editorRevision:Number(cena.editorRevision||0)+1};
   if(JSON.stringify(nova).length>LIMITE_CENA*1.4)throw Error('Marcas demais para um mapa só (a cena ficou grande). Junte áreas pequenas em retângulos maiores.');
   await dep.setDoc(D(ARQ(mapId)),clean(nova));
   try{const s=await dep.getDoc(D(SCENE));if(s.exists()&&String(s.data()?.mapId||'')===mapId)await dep.setDoc(D(SCENE),clean(nova));}catch(_){}
   const res=resumoMarcas(marcas);
   pendente=false;cenaVista=nova;
   estado(`✅ Aplicado: ${Object.entries(res).map(([t,n])=>`${ETIQUETAS[t]?.ic||''}${n}`).join(' ')}. Os jogadores já veem.`);
   try{ctl()?.refreshView?.();}catch(_){}
  }catch(e){console.warn('[Marcador] aplicar',e);estado('⚠️ '+(e?.message||e));}
  finally{ocupado=false;desenharPainel();}
 }
 async function salvarImagem(avisar=true){
  if(!fundo.alterada||!fundo.tela)return;
  const {blob,tipo}=await paraBlob(fundo.tela,false),url=await enviar(blob,tipo,mapId+'-fundo');
  const cena=await cenaAtual();if(cena){const nova={...cena,objects:(cena.objects||[]).map(o=>ehFundo(o)?{...o,imagem:url,...(o.oficinaElement?{oficinaElement:{...o.oficinaElement,src:url}}:{})}:o)};
   await dep.setDoc(D(ARQ(mapId)),clean(nova));try{const s=await dep.getDoc(D(SCENE));if(s.exists()&&String(s.data()?.mapId||'')===mapId)await dep.setDoc(D(SCENE),clean(nova));}catch(_){}}
  await dep.setDoc(D('mapas/'+mapId),clean({imagemV163:{src:url,W,H}}),{merge:true});
  fundo.src=url;fundo.alterada=false;fundo.original=null;
  if(avisar){estado('🖼️ Imagem salva: os jogadores já veem sem as coisas apagadas.');try{ctl()?.refreshView?.();}catch(_){}}
  desenhar();desenharPainel();
 }
 function desfazerImagem(){if(!fundo.original)return;fundo.tela.getContext('2d').drawImage(fundo.original,0,0);fundo.alterada=false;fundo.original=null;try{fundo.px=fundo.tela.getContext('2d',{willReadFrequently:true}).getImageData(0,0,fundo.tela.width,fundo.tela.height).data;}catch(_){}desenhar();desenharPainel();}

 // ------------------------------------------------------------ v164: interior de uma casa (mapa à parte, ligado pela porta)
 // A casa é o conjunto de marcas de parede/terraço com o mesmo nome. A porta é uma marca "porta" encostada nela; sem porta,
 // usa o lado da casa que dá para a rua. O interior é gerado (salas, móveis) com o tamanho da casa e fica ligado à porta.
 const marcasDaCasa=m=>marcas.filter(x=>['terraco','parede'].includes(x.tipo)&&(x.id===m.id||(m.nome&&x.nome===m.nome)));
 const bloqueia=(x,y)=>marcas.some(k=>(ETIQUETAS[k.tipo]?.bloq)&&contem(k,x,y));
 function portaDaCasa(casa){
  const bs=casa.map(caixaDaMarca),b={x:Math.min(...bs.map(r=>r.x)),y:Math.min(...bs.map(r=>r.y))};b.w=Math.max(...bs.map(r=>r.x+r.w))-b.x;b.h=Math.max(...bs.map(r=>r.y+r.h))-b.y;
  const porta=marcas.find(k=>k.tipo==='porta'&&(()=>{const r=caixaDaMarca(k);return r.x<b.x+b.w+.8&&r.x+r.w>b.x-.8&&r.y<b.y+b.h+.8&&r.y+r.h>b.y-.8;})());
  const lados=[['s',b.x+b.w/2,b.y+b.h+.7],['n',b.x+b.w/2,b.y-.7],['o',b.x-.7,b.y+b.h/2],['l',b.x+b.w+.7,b.y+b.h/2]];
  if(porta){const r=caixaDaMarca(porta),cx=r.x+r.w/2,cy=r.y+r.h/2;const lado=lados.map(l=>[l,Math.hypot(l[1]-cx,l[2]-cy)]).sort((a,c)=>a[1]-c[1])[0][0][0];
   const p={s:[cx,b.y+b.h+.7],n:[cx,b.y-.7],o:[b.x-.7,cy],l:[b.x+b.w+.7,cy]}[lado];return {b,lado,x:p[0],y:p[1]};}
  const ok=lados.find(([,x,y])=>x>0&&y>0&&x<W&&y<H&&!bloqueia(x,y))||lados[0];return {b,lado:ok[0],x:ok[1],y:ok[2]};
 }
 async function criarInterior(m){
  const casa=marcasDaCasa(m);if(!casa.length)throw Error('Selecione a marca de uma casa (parede ou terraço).');
  const nome=String(m.nome||'').trim()||'Casa';const P=portaDaCasa(casa),Wi=Math.max(8,Math.round(P.b.w)),Hi=Math.max(6,Math.round(P.b.h));
  const nomeMapa=`${nome} · por dentro`,state=gerarMapa({tipo:'interior',largura:Wi,altura:Hi,objetos:dep.objetos?.()||[],nome:nomeMapa,estilo:'retro'});
  const api=win.mesaMapasV110_;if(!api?.salvar)throw Error('Gerador de mapas indisponível.');
  const r=await api.salvar({nome:nomeMapa,state,cenaDe:mid=>{const c=cenaDoEstado(state,mid);return JSON.stringify(c).length<=LIMITE_CENA?c:null;}});
  const dentro={s:{x:Wi/2,y:Hi-1.2},n:{x:Wi/2,y:1.2},o:{x:1.2,y:Hi/2},l:{x:Wi-1.2,y:Hi/2}}[P.lado];
  const N=(p,w,h)=>({x:+(p.x*28/w).toFixed(3),y:+(p.y*14/h).toFixed(3)});
  const lig={id:'lig'+Date.now().toString(36),a:{mapa:mapId,...N({x:P.x,y:P.y},W,H)},b:{mapa:r.id,...N(dentro,Wi,Hi)},tipo:'porta',interiorV164:true};
  const s=await dep.getDoc(D('combatesAtivos/mesaLigacoes'));const v=s.exists()?s.data():{};
  await dep.setDoc(D('combatesAtivos/mesaLigacoes'),clean({...v,ligacoes:[...(v.ligacoes||[]),lig],atualizadoEm:Date.now()}));
  mudar(()=>{for(const k of casa)k.interiorV164=r.id;});
  return {id:r.id,nome:nomeMapa,W:Wi,H:Hi,lado:P.lado};
 }
 // v219: prepara as casas do mapa de uma vez (a mesma ação do botão de uma casa, em lote).
 // Cada interior é um mapa à parte ligado pela porta; ao chegar perto da porta, o personagem entra sozinho.
 function casasSemInterior(){
  const grupos=new Map();
  for(const m of marcas){if(!['terraco','parede'].includes(m.tipo)||m.interiorV164)continue;
   const k=String(m.nome||m.id);if(!grupos.has(k))grupos.set(k,[]);grupos.get(k).push(m);}
  return [...grupos.values()];
 }
 async function criarInterioresDasCasas(){
  const todas=casasSemInterior(),lote=todas.slice(0,20);let ok=0,erros=0;
  for(const casa of lote){
   try{await criarInterior(casa[0]);ok++;estado(`🏠 ${ok}/${lote.length} interiores criados…`);}
   catch(e){erros++;console.warn('[Marcador] interior',e);}
  }
  const restantes=Math.max(0,todas.length-lote.length);
  estado(`🏠 ${ok} interior(es) criado(s)${erros?`, ${erros} falha(s)`:''}${restantes?`. Ainda faltam ${restantes}; clique de novo.`:'.'}`);
  return {ok,erros,total:todas.length,restantes};
 }

 // ------------------------------------------------------------ peças (banco de objetos)
 async function salvarPeca(m,nome){
  if(!fundo.tela)throw Error('Sem a imagem de fundo.');
  const b=caixaDaMarca(m),E=ETIQUETAS[m.tipo]||{},{blob,tipo}=await paraBlob(recorte([m],b),true),url=await enviar(blob,tipo,'peca-'+nome);
  const objs=dep.objetos?.()||[];let id='peca_'+slug(nome),n=2;const base=id;while(objs.some(o=>String(o.id)===id))id=`${base}_${n++}`;
  const modelo={id,nome,tipoVisual:'personalizado',larguraM:+b.w.toFixed(2),alturaM:+b.h.toFixed(2),camada:E.acima||E.teto?5:(E.bloq?3:1),material:m.tipo==='rocha'?'pedra':'',pesoKg:0,pvMax:0,dureza:0,destrutivel:false,inflamabilidade:0,inflamavel:false,
   bloqueiaMovimento:!!E.bloq||!!m.bloq,bloqueiaVisao:!!E.visao,fixoAoMapa:false,imagem:url,pecaV163:{etiqueta:m.tipo,deMapa:mapId},...(E.teto?{tetoV139:true}:{})};
  await dep.setDoc(D('configuracoes/objetoMapa_'+id.replace(/[^a-zA-Z0-9_-]/g,'_')),clean(modelo));
  const idx=await dep.getDoc(D('configuracoes/objetosMapa'));const atual=idx.exists()?idx.data():{};
  const ids=[...new Set([...(Array.isArray(atual.ids)?atual.ids:objs.map(o=>o.id)),id])];
  await dep.setDoc(D('configuracoes/objetosMapa'),{...atual,formato:'docs-v1',ids,atualizadoEm:new Date().toISOString()});
  try{objs.push(modelo);}catch(_){}
  return modelo;
 }

 // ------------------------------------------------------------ novo mapa a partir de imagem
 async function novoMapa(arquivo,nome,largura){
  if(!arquivo)throw Error('Escolha a imagem.');nome=String(nome||'').trim()||arquivo.name.replace(/\.[a-z]+$/i,'');
  const url0=URL.createObjectURL(arquivo);const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(Error('Não consegui abrir a imagem.'));i.src=url0;});
  const Wm=Math.max(8,Math.min(120,Number(largura)||32)),Hm=+(Wm*img.naturalHeight/img.naturalWidth).toFixed(2);
  // até 40 px por metro (imagem muito grande é reduzida)
  const k=Math.min(40,img.naturalWidth/Wm),c=root.createElement('canvas');c.width=Math.round(Wm*k);c.height=Math.round(Hm*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url0);
  const {blob,tipo}=await paraBlob(c,false),src=await enviar(blob,tipo,nome);
  const state=estadoDeImagem({nome,src,W:Wm,H:Hm});
  const api=win.mesaMapasV110_;if(!api?.salvar)throw Error('Gerador de mapas indisponível.');
  const r=await api.salvar({nome,state,cenaDe:mid=>{const c2=cenaDoEstado(state,mid);return JSON.stringify(c2).length<=LIMITE_CENA?c2:null;}});
  await dep.setDoc(D('mapas/'+r.id),clean({imagemV163:{src,W:Wm,H:Hm},marcasV163:[],estiloV129:'imagem'}),{merge:true});
  return {id:r.id,nome,W:Wm,H:Hm};
 }

 // ------------------------------------------------------------ painel
 let msg='';const estado=t=>{msg=t;const n=painel?.querySelector('.mk-st');if(n)n.textContent=t;};
 function desenharPainel(){
  if(!painel)return;
  const m=marcas.find(x=>x.id===sel),res=resumoMarcas(marcas),nome=registro()?.nome||mapId;
  const F=[['sel','👆','Selecionar'],['ret','▭','Retângulo'],['poli','⬠','Polígono'],['varinha','🪄','Varinha'],['apagar','🧽','Apagar da imagem']];
  painel.innerHTML=`<h3><span>🖌️ Marcador · ${esc(nome)}</span><button type="button" data-x title="Fechar o marcador">✕</button></h3>
   <div class="mk-dica">${W}×${H} m${fundo.src?'':' · ⚠️ este mapa não tem imagem de fundo'}</div>
   <div class="mk-g">${F.map(([k,ic,t])=>`<button type="button" data-f="${k}" aria-pressed="${ferramenta===k}" title="${t}">${ic} ${t}</button>`).join('')}</div>
   ${ferramenta==='varinha'?`<label class="mk-dica">Tolerância da cor: <b>${tol}</b><input type="range" min="8" max="90" value="${tol}" data-tol style="width:100%"></label><label class="mk-dica">Alcance máximo: <b>${alcance} m</b> em volta do clique<input type="range" min="1" max="15" value="${alcance}" data-alc style="width:100%"></label>`:''}
   ${ferramenta==='apagar'?`<div class="mk-dica">Arraste sobre o que quer apagar; depois clique num chão limpo.${fundo.alterada?'':''}</div>`:''}
   <div class="mk-dica" style="margin-top:4px">Etiqueta das próximas marcas:</div>
   <div class="mk-et">${ORDEM_ETIQUETAS.map(k=>`<button type="button" data-e="${k}" aria-pressed="${etiqueta===k}" title="${esc(ETIQUETAS[k].nome)}"><i style="background:${ETIQUETAS[k].cor}"></i>${ETIQUETAS[k].ic} ${esc(ETIQUETAS[k].nome.split(' (')[0])}${res[k]?` <small>${res[k]}</small>`:''}</button>`).join('')}</div>
   ${m?`<div class="mk-s"><b>Marca selecionada</b>
    <select data-mt>${ORDEM_ETIQUETAS.map(k=>`<option value="${k}" ${m.tipo===k?'selected':''}>${ETIQUETAS[k].ic} ${esc(ETIQUETAS[k].nome)}</option>`).join('')}</select>
    <input type="text" data-mn placeholder="Nome (ex.: Casa do ferreiro)" value="${esc(m.nome||'')}">
    ${ETIQUETAS[m.tipo]?.acima?`<label class="mk-dica"><input type="checkbox" data-mb ${m.bloq?'checked':''} style="width:auto"> também bloqueia a passagem</label>`:''}
    <div class="mk-g"><button type="button" data-apaga>🗑️ Tirar marca</button><button type="button" data-peca ${fundo.tela?'':'disabled'} title="O pedaço da imagem vira objeto do Banco de Objetos de Mapa">💾 Salvar como peça</button>
    ${['terraco','parede'].includes(m.tipo)?(m.interiorV164?`<span class="mk-dica">🏠 Interior: ${esc((mapas().find(x=>String(x.id)===m.interiorV164)?.nome)||m.interiorV164)}</span>`:`<button type="button" data-interior ${ocupado?'disabled':''} title="Cria o mapa de dentro desta casa (do tamanho dela) e liga pela porta. Ponha antes uma marca 🚪 Porta onde fica a entrada.">🏠 Criar interior</button>`):''}</div></div>
    <div class="mk-g"><button type="button" data-interiores ${ocupado?'disabled':''} title="Cria, em lote, o interior de todas as casas deste mapa que ainda não têm um. Cada casa vira um mapa ligado pela porta; ao chegar perto, o personagem entra sozinho.">🏠 Todos os interiores</button></div>`:''}
   <div class="mk-g"><button type="button" data-desfaz ${desfazer.length?'':'disabled'}>↶ Desfazer</button><button type="button" data-ver aria-pressed="${mostrar}" title="Mostrar/esconder as marcas (o que você vai aplicar)">👁️ Marcas</button><button type="button" data-col aria-pressed="${verColisao}" title="Ver o que está valendo agora no mapa: vermelho barra quem anda na rua, roxo tracejado é terraço (2º andar), amarelo é escada">🧱 Ver colisão</button><button type="button" data-cena title="Trocar as marcas pelo que está valendo agora no mapa (paredes, obstáculos, escadas, terraços)">📥 Marcas do mapa</button>
    ${fundo.alterada?`<button type="button" data-img>🖼️ Salvar imagem</button><button type="button" data-imgx>↺ Desfazer apagados</button>`:''}</div>
   <div class="mk-g"><button type="button" data-aplica ${ocupado||!fundo.tela?'disabled':''} style="border-color:#63e6be${pendente?';background:#0f5a3f;font-weight:700':''}">✅ Aplicar no mapa${pendente?' (há mudanças)':''}</button></div>
   <div class="mk-st">${esc(msg)}</div>
   <details class="mk-s"><summary>🖼️ Novo mapa de uma imagem</summary>
    <input type="file" accept="image/*" data-arq><input type="text" data-nnome placeholder="Nome do mapa"><label class="mk-dica">Largura em metros (a altura sai da proporção da imagem)<input type="number" data-larg value="32" min="8" max="120"></label>
    <button type="button" data-novo ${ocupado?'disabled':''}>Criar mapa</button></details>`;
 }
 function arrastavel(el){let ini=null;el.addEventListener('pointerdown',e=>{if(!e.target.closest('h3')||e.target.closest('button'))return;const r=el.getBoundingClientRect();ini={dx:e.clientX-r.left,dy:e.clientY-r.top};el.setPointerCapture?.(e.pointerId);});
  el.addEventListener('pointermove',e=>{if(!ini)return;el.style.left=Math.max(0,e.clientX-ini.dx)+'px';el.style.top=Math.max(0,e.clientY-ini.dy)+'px';});el.addEventListener('pointerup',()=>{ini=null;});}
 function criarPainel(){
  painel=root.createElement('div');painel.id='mkPainel';painel.hidden=true;root.body.append(painel);arrastavel(painel);
  painel.addEventListener('pointerdown',e=>e.stopPropagation());
  painel.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;
   if(b.dataset.x!==undefined){fechar();return;}
   if(b.dataset.f){ferramenta=b.dataset.f;poli=[];rasc=null;apagar=null;estado({sel:'Clique numa marca para mudar ou tirar.',ret:'Arraste sobre a imagem.',poli:'Clique nos cantos; duplo clique fecha.',varinha:'Clique numa cor: pega a área parecida em volta.',apagar:'Arraste sobre o que quer apagar da imagem.'}[ferramenta]);desenhar();desenharPainel();return;}
   if(b.dataset.e){etiqueta=b.dataset.e;desenharPainel();return;}
   if(b.dataset.apaga!==undefined){mudar(()=>{marcas=marcas.filter(x=>x.id!==sel);sel=null;});return;}
   if(b.dataset.desfaz!==undefined){const v=desfazer.pop();if(v){marcas=JSON.parse(v);sel=null;guardar();desenhar();desenharPainel();}return;}
   if(b.dataset.ver!==undefined){mostrar=!mostrar;desenhar();desenharPainel();return;}
   if(b.dataset.col!==undefined){verColisao=!verColisao;if(verColisao)cenaVista=await cenaAtual();desenhar();desenharPainel();return;}
   if(b.dataset.cena!==undefined){const c=await cenaAtual();const novas=marcasDaCena(c,W,H);if(!novas.length){estado('Não há paredes invisíveis neste mapa para trazer.');return;}mudar(()=>{marcas=novas.concat(marcas.filter(m=>['acima','planta','teto','tapete','porta'].includes(m.tipo)));sel=null;});estado(`📥 ${novas.length} marcas vieram do mapa. Os toldos/plantas marcados continuam.`);return;}
   if(b.dataset.img!==undefined){ocupado=true;desenharPainel();try{await salvarImagem(true);}catch(err){estado('⚠️ '+(err?.message||err));}finally{ocupado=false;desenharPainel();}return;}
   if(b.dataset.imgx!==undefined){desfazerImagem();return;}
   if(b.dataset.aplica!==undefined){await aplicar();return;}
   if(b.dataset.peca!==undefined){const m=marcas.find(x=>x.id===sel);if(!m)return;const nome=String(m.nome||'').trim()||ETIQUETAS[m.tipo]?.nome.split(' ')[0]+' '+(marcas.indexOf(m)+1);
    ocupado=true;desenharPainel();estado('⏳ Salvando a peça…');try{const p=await salvarPeca(m,nome);estado(`💾 "${p.nome}" está no Banco → Objetos de Mapa (${p.larguraM}×${p.alturaM} m). Já dá para pôr em outros mapas.`);}catch(err){estado('⚠️ '+(err?.message||err));}finally{ocupado=false;desenharPainel();}return;}
   if(b.dataset.interiores!==undefined){if(ocupado)return;ocupado=true;desenharPainel();estado('⏳ Criando os interiores das casas…');
     try{await criarInterioresDasCasas();}catch(err){estado('⚠️ '+(err?.message||err));}finally{ocupado=false;desenharPainel();}return;}
    if(b.dataset.interior!==undefined){const m=marcas.find(x=>x.id===sel);if(!m)return;ocupado=true;desenharPainel();estado('⏳ Criando o interior…');
    try{const r=await criarInterior(m);estado(`🏠 "${r.nome}" criado (${r.W}×${r.H} m), ligado pela porta do lado ${({s:'sul',n:'norte',o:'oeste',l:'leste'})[r.lado]}. Ajuste os móveis abrindo esse mapa.`);}catch(err){estado('⚠️ '+(err?.message||err));}finally{ocupado=false;desenharPainel();}return;}
   if(b.dataset.novo!==undefined){const arq=painel.querySelector('[data-arq]')?.files?.[0],nome=painel.querySelector('[data-nnome]')?.value,larg=painel.querySelector('[data-larg]')?.value;
    ocupado=true;desenharPainel();estado('⏳ Enviando a imagem e criando o mapa…');try{const r=await novoMapa(arq,nome,larg);estado(`🗺️ Mapa "${r.nome}" criado (${r.W}×${r.H} m). Abra ele no seletor de mapas e use o marcador.`);}catch(err){estado('⚠️ '+(err?.message||err));}finally{ocupado=false;desenharPainel();}return;}
  });
  painel.addEventListener('change',e=>{const t=e.target,m=marcas.find(x=>x.id===sel);
   if(t.dataset.mt!==undefined&&m){mudar(()=>{m.tipo=t.value;});}
   else if(t.dataset.mn!==undefined&&m){mudar(()=>{m.nome=t.value.trim();});}
   else if(t.dataset.mb!==undefined&&m){mudar(()=>{m.bloq=t.checked;});}
   else if(t.dataset.tol!==undefined){tol=Number(t.value)||40;desenharPainel();}
   else if(t.dataset.alc!==undefined){alcance=Number(t.value)||4;desenharPainel();}});
 }
 async function abrir(){
  if(!ehMestre())return;if(!painel)criarPainel();
  if(!String(ctl()?.mapaAtual?.()||'')){toast('Abra um mapa primeiro.');return;}
  aberto=true;painel.hidden=false;msg='Escolha a ferramenta e a etiqueta, e marque por cima da imagem.';await carregar();
 }
 function fechar(){aberto=false;if(painel)painel.hidden=true;poli=[];rasc=null;apagar=null;desenhar();}
 root.addEventListener('keydown',e=>{if(!aberto)return;if(e.key==='Escape'){poli=[];rasc=null;apagar=null;desenhar();estado('');}
  else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!/input|textarea/i.test(e.target?.tagName||'')){e.preventDefault();const v=desfazer.pop();if(v){marcas=JSON.parse(v);sel=null;guardar();desenhar();desenharPainel();}}
  else if((e.key==='Delete'||e.key==='Backspace')&&sel&&!/input|textarea|select/i.test(e.target?.tagName||'')){e.preventDefault();mudar(()=>{marcas=marcas.filter(x=>x.id!==sel);sel=null;});}});
 function garantirBotao(){
  if(!ehMestre()){botao?.remove();botao=null;return;}
  if(!root.getElementById('novaSyncBoard'))return;
  if(!botao||!botao.isConnected){botao=root.createElement('button');botao.type='button';botao.id='mkBotao';botao.textContent='🖌️';botao.title='Marcador de áreas: transformar a imagem deste mapa em mapa jogável (paredes, tetos, coisas por cima, peças)';
   botao.addEventListener('click',()=>{aberto?fechar():void abrir();});(root.getElementById('mbTopo')?.querySelector('[data-g=esq]')||root.body).append(botao);}
 }
 let ultimoMapa='';
 const vigia=setInterval(()=>{try{garantirBotao();if(aberto){const id=String(ctl()?.mapaAtual?.()||'');if(id&&id!==ultimoMapa&&ultimoMapa){ultimoMapa=id;void carregar();}else ultimoMapa=id;garantirSvg();}}catch(e){console.warn('[Marcador]',e);}},1200);
 win.mesaMarcadorV163={abrir,fechar,aplicar,criarInterior,criarInterioresDasCasas,marcas:()=>marcas,definir:m=>{marcas=clean(m);guardar();desenhar();desenharPainel();},salvarPeca,novoMapa,estado:()=>({aberto,mapId,W,H,ferramenta,etiqueta,fundo:!!fundo.tela})};
 return {parar(){clearInterval(vigia);botao?.remove();painel?.remove();svg?.remove();}};
}
