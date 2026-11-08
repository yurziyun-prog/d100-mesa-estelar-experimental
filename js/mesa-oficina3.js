// Mesa Estelar v175 — 🏗️ Oficina 3.0: construir o mapa AO VIVO, direto na mesa (só o mestre vê as ferramentas).
//
// Nada de "salvar e publicar": cada parede, chão, teto, porta, pincelada ou objeto vai na hora para o mapa aberto e
// quem estiver nele (jogadores ou o mestre atuando) já vê e já esbarra. As ferramentas ficam numa faixa FORA do mapa.
//  🧱 Construir: parede, cômodo (chão + paredes + teto), chão, teto/telhado, porta, janela, escada, bloqueio invisível,
//     apagar, e o ↖ selecionar/mover/girar do 🛠️ da mesa.
//  🖌️ Pincéis: texturas (pedra, palha, grama…) pintadas à mão livre por cima do chão. As que vêm prontas são básicas;
//     as boas o mestre pede ao GPT e acrescenta em "➕ Novo pincel" (imagem quadrada, sem emenda).
//  📦 Objetos: tudo do banco de objetos de mapa (e as peças das imagens), no tamanho real; ⟳ gira.
//  🗺️ Mapas: mapa novo em branco, abrir outro, renomear, 🚪 saída daqui para outro mapa.
// Paredes, chão e teto são objetos comuns da mesa (com textura): o 🛠️ seleciona, move e apaga; tetos somem quando
// alguém entra; portas abrem/fecham/trancam como as outras. Pinceladas ficam em combatesAtivos/oficina3_<mapa>.

import {pontoDeBorda,afastarNaBorda,OPOSTO,ladoDoPonto} from './mesa-ligacoes.js?v=154';
import {cenaDoEstado,LIMITE_CENA} from './mesa-mapas-ui.js?v=141';
import {MATERIAIS,PECAS,montarPeca,contorno,texMat,pecaDe,matDe,blocosLinha,PINTURAS,PISOS,CORES_LISAS,pisoDe,categoriaDeObjeto,corLisa,ehParede,miraDe,giroAuto,limitarDesl,grupoDaPeca,alvoNaMira,deslocar,centroDe,pintar,colorir,saidaPerto,chegadaDentro} from './mesa-construcao.js?v=180';
import {destinoSemColisao} from './nova-colisao.js?v=180';
import {renderizarMiniatura,specDeNpc,svgParaDataUrl} from './mesa-miniaturas.js?v=194';
import {LIGACOES} from './mesa-ligacoes.js?v=154';

export const NOME_CONSTRUTOR='Brunel Obras';
const clean=v=>JSON.parse(JSON.stringify(v??null));
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const SCENE='combatesAtivos/mapaMesaSyncDiretaCena',ARQ=id=>'combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(id);
export const DOC_TRACOS=id=>'combatesAtivos/oficina3_'+encodeURIComponent(id);
export const DOC_PINCEIS='configuracoes/pinceisV3';

// texturas que já vêm (arte/texturas, feitas por arte-fonte/texturas_basicas.py). tamM = quantos metros um ladrilho cobre
export const TEXTURAS_BASE=[
 {id:'pedra',nome:'Pedra',src:'arte/texturas/pedra.webp',tamM:2},{id:'tijolo',nome:'Tijolo',src:'arte/texturas/tijolo.webp',tamM:2},
 {id:'madeira',nome:'Madeira',src:'arte/texturas/madeira.webp',tamM:2},{id:'telha',nome:'Telha',src:'arte/texturas/telha.webp',tamM:2},
 {id:'palha',nome:'Palha',src:'arte/texturas/palha.webp',tamM:2},{id:'metal',nome:'Metal',src:'arte/texturas/metal.webp',tamM:2},
 {id:'azulejo',nome:'Azulejo',src:'arte/texturas/azulejo.webp',tamM:2},{id:'rocha',nome:'Rocha',src:'arte/texturas/rocha.webp',tamM:3},
 {id:'areia',nome:'Areia',src:'arte/texturas/areia.webp',tamM:3},{id:'terra',nome:'Terra',src:'arte/texturas/terra.webp',tamM:3},
 // v197: acabamentos nobres e industriais (geradas por scripts/gerar-texturas-v197.cjs, sem emenda)
 {id:'aco_escovado',nome:'Aço escovado',src:'arte/texturas/aco_escovado.webp',tamM:2},{id:'chapa_xadrez',nome:'Chapa xadrez',src:'arte/texturas/chapa_xadrez.webp',tamM:2},{id:'painel_scifi',nome:'Painel sci-fi',src:'arte/texturas/painel_scifi.webp',tamM:2},{id:'metal_ferrugem',nome:'Metal enferrujado',src:'arte/texturas/metal_ferrugem.webp',tamM:2},{id:'cromado',nome:'Cromado',src:'arte/texturas/cromado.webp',tamM:2},
 {id:'marmore_branco',nome:'Mármore branco',src:'arte/texturas/marmore_branco.webp',tamM:2},{id:'marmore_negro',nome:'Mármore negro',src:'arte/texturas/marmore_negro.webp',tamM:2},{id:'marmore_vermelho',nome:'Mármore vermelho',src:'arte/texturas/marmore_vermelho.webp',tamM:2},
 {id:'ouro',nome:'Ouro',src:'arte/texturas/ouro.webp',tamM:2},{id:'jade',nome:'Jade',src:'arte/texturas/jade.webp',tamM:2},
 {id:'grama',nome:'Grama',src:'arte/texturas/grama.webp',tamM:3},{id:'agua',nome:'Água',src:'arte/texturas/agua.webp',tamM:3},
 // v198: natureza, lava, lixo e florestas (scripts/gerar-texturas-v198.cjs)
 {id:'agua_rasa',nome:'Água rasa',src:'arte/texturas/agua_rasa.webp',tamM:3},{id:'agua_profunda',nome:'Água profunda',src:'arte/texturas/agua_profunda.webp',tamM:3},{id:'agua_pantano',nome:'Água de pântano',src:'arte/texturas/agua_pantano.webp',tamM:3},{id:'agua_suja',nome:'Água turva',src:'arte/texturas/agua_suja.webp',tamM:3},{id:'areia_clara',nome:'Areia clara',src:'arte/texturas/areia_clara.webp',tamM:3},{id:'areia_escura',nome:'Areia vulcânica',src:'arte/texturas/areia_escura.webp',tamM:3},{id:'areia_deserto',nome:'Areia do deserto',src:'arte/texturas/areia_deserto.webp',tamM:3},{id:'terra_rachada',nome:'Terra rachada',src:'arte/texturas/terra_rachada.webp',tamM:3},{id:'lama',nome:'Lama',src:'arte/texturas/lama.webp',tamM:3},{id:'terra_batida',nome:'Terra batida',src:'arte/texturas/terra_batida.webp',tamM:3},{id:'cascalho',nome:'Cascalho',src:'arte/texturas/cascalho.webp',tamM:2},{id:'pedregulhos',nome:'Rochas soltas',src:'arte/texturas/pedregulhos.webp',tamM:3},{id:'grama_curta',nome:'Grama curta',src:'arte/texturas/grama_curta.webp',tamM:3},{id:'grama_alta',nome:'Grama alta',src:'arte/texturas/grama_alta.webp',tamM:3},{id:'grama_seca',nome:'Grama seca',src:'arte/texturas/grama_seca.webp',tamM:3},{id:'flores_amarelas',nome:'Flores amarelas',src:'arte/texturas/flores_amarelas.webp',tamM:3},{id:'flores_vermelhas',nome:'Flores vermelhas',src:'arte/texturas/flores_vermelhas.webp',tamM:3},{id:'flores_azuis',nome:'Flores azuis',src:'arte/texturas/flores_azuis.webp',tamM:3},{id:'sucata',nome:'Sucata',src:'arte/texturas/sucata.webp',tamM:3},{id:'lixo',nome:'Lixo',src:'arte/texturas/lixo.webp',tamM:3},{id:'lava',nome:'Lava vulcânica',src:'arte/texturas/lava.webp',tamM:3},{id:'lava_fluida',nome:'Lava fluida',src:'arte/texturas/lava_fluida.webp',tamM:3},{id:'rocha_vulcanica',nome:'Rocha vulcânica',src:'arte/texturas/rocha_vulcanica.webp',tamM:3},
 {id:'solo_nevado',nome:'Solo nevado',src:'arte/texturas/solo_nevado.webp',tamM:3},{id:'gelo',nome:'Gelo',src:'arte/texturas/gelo.webp',tamM:3},{id:'parede_gelo',nome:'Parede de gelo',src:'arte/texturas/parede_gelo.webp',tamM:2},{id:'paredao_gelo',nome:'Paredão de gelo',src:'arte/texturas/paredao_gelo.webp',tamM:2},
 // v198: chãos de floresta e COPAS (fundo transparente, ficam por cima; ids começam com copa_)
 {id:'chao_floresta',nome:'Chão de floresta',src:'arte/texturas/chao_floresta.webp',tamM:3},{id:'chao_floresta_outono',nome:'Chão de outono',src:'arte/texturas/chao_floresta_outono.webp',tamM:3},{id:'chao_floresta_neve',nome:'Chão de floresta nevada',src:'arte/texturas/chao_floresta_neve.webp',tamM:3},{id:'chao_conifera',nome:'Chão de coníferas',src:'arte/texturas/chao_conifera.webp',tamM:3},{id:'chao_tropical',nome:'Chão tropical',src:'arte/texturas/chao_tropical.webp',tamM:3},{id:'chao_palmeiral',nome:'Chão de palmeiral',src:'arte/texturas/chao_palmeiral.webp',tamM:3},{id:'chao_arbustal',nome:'Chão de arbustal',src:'arte/texturas/chao_arbustal.webp',tamM:3}
];
export const PADRAO={parede:'tijolo',comodo:'madeira',chao:'madeira',teto:'telha',escada:'madeira',pincel:'grama',porta:'madeira'};
const MATERIAL={pedra:['pedra',14],tijolo:['pedra',12],rocha:['pedra',16],madeira:['madeira',6],palha:['palha',2],metal:['metal',18],azulejo:['pedra',10],aco_escovado:['metal',20],lava:['pedra',24],gelo:['pedra',16],parede_gelo:['pedra',18],paredao_gelo:['pedra',22],lava_fluida:['pedra',24],rocha_vulcanica:['pedra',22],cascalho:['pedra',12],pedregulhos:['pedra',14],sucata:['metal',12],lixo:['madeira',4],chapa_xadrez:['metal',18],painel_scifi:['metal',22],metal_ferrugem:['metal',10],cromado:['metal',22],marmore_branco:['pedra',18],marmore_negro:['pedra',20],marmore_vermelho:['pedra',18],ouro:['metal',8],jade:['pedra',20]};

// ---------------------------------------------------------------- geometria (metros; puro)
export const encaixar=(v,p=.5)=>Math.round(v/p)*p;
export function retDeArrasto(a,b,p=.5){const x0=encaixar(Math.min(a.x,b.x),p),y0=encaixar(Math.min(a.y,b.y),p),x1=encaixar(Math.max(a.x,b.x),p),y1=encaixar(Math.max(a.y,b.y),p);return {x:x0,y:y0,w:Math.max(p,x1-x0),h:Math.max(p,y1-y0)};}
// parede reta (horizontal ou vertical, pelo lado mais comprido do arrasto), com a espessura dada
export function paredeEntre(a,b,esp=.3,p=.5){
 const ax=encaixar(a.x,p),ay=encaixar(a.y,p),bx=encaixar(b.x,p),by=encaixar(b.y,p);
 if(Math.abs(bx-ax)>=Math.abs(by-ay)){const x0=Math.min(ax,bx),x1=Math.max(ax,bx);return {x:x0-esp/2,y:ay-esp/2,w:Math.max(p,x1-x0)+esp,h:esp};}
 const y0=Math.min(ay,by),y1=Math.max(ay,by);return {x:ax-esp/2,y:y0-esp/2,w:esp,h:Math.max(p,y1-y0)+esp};
}
// quatro paredes por dentro da borda de um retângulo
export function paredesDoComodo(r,esp=.3){return [{x:r.x,y:r.y,w:r.w,h:esp},{x:r.x,y:r.y+r.h-esp,w:r.w,h:esp},{x:r.x,y:r.y+esp,w:esp,h:r.h-2*esp},{x:r.x+r.w-esp,y:r.y+esp,w:esp,h:r.h-2*esp}].filter(q=>q.w>.05&&q.h>.05);}
// abre um vão de largura L numa parede (retângulo) no ponto p: devolve {pedacos:[...], vao}
export function abrirVao(par,p,L=1){
 const hor=par.w>=par.h;
 if(hor){const c=Math.max(par.x+L/2,Math.min(par.x+par.w-L/2,p.x)),a=c-L/2,b=c+L/2;return {pedacos:[{x:par.x,y:par.y,w:a-par.x,h:par.h},{x:b,y:par.y,w:par.x+par.w-b,h:par.h}].filter(q=>q.w>.12),vao:{x:a,y:par.y,w:L,h:par.h},hor};}
 const c=Math.max(par.y+L/2,Math.min(par.y+par.h-L/2,p.y)),a=c-L/2,b=c+L/2;return {pedacos:[{x:par.x,y:par.y,w:par.w,h:a-par.y},{x:par.x,y:b,w:par.w,h:par.y+par.h-b}].filter(q=>q.h>.12),vao:{x:par.x,y:a,w:par.w,h:L},hor};
}
// pincelada mais leve: tira pontos a menos de d metros do anterior
export function simplificar(pts,d=.25){const out=[];for(const p of pts){const u=out[out.length-1];if(!u||Math.hypot(p[0]-u[0],p[1]-u[1])>=d)out.push([+p[0].toFixed(2),+p[1].toFixed(2)]);}if(pts.length&&out.length){const l=pts[pts.length-1],u=out[out.length-1];if(Math.abs(u[0]-l[0])>.01||Math.abs(u[1]-l[1])>.01)out.push([+l[0].toFixed(2),+l[1].toFixed(2)]);}return out;}
const distSeg=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy;let t=l?((p.x-a[0])*dx+(p.y-a[1])*dy)/l:0;t=Math.max(0,Math.min(1,t));return Math.hypot(p.x-(a[0]+t*dx),p.y-(a[1]+t*dy));};
export function tracoPerto(tracos,p){let m=null,dm=1e9;for(const t of tracos||[]){const pts=t.pts||[];for(let i=0;i<pts.length;i++){const d=i?distSeg(p,pts[i-1],pts[i]):Math.hypot(p.x-pts[i][0],p.y-pts[i][1]);if(d<=Number(t.w||1)/2+.3&&d<dm){dm=d;m=t;}}}return m;}
// objeto da cena que está debaixo do ponto (o menor; sem fundo nem coberturas)
export function objetoNoPonto(objs,p,W,H){
 let m=null,am=1e9;
 for(const o of objs||[]){const e=o.oficinaElement||{};if(e.fundoV161||e.acimaV163||o.fundoV161||/:fundo$|:acima$/.test(String(o.id)))continue;
  const g=Math.abs(Math.round((Number(o.angulo)||0)/90))%2===1,w=(g?+o.alturaM:+o.larguraM)||1,h=(g?+o.larguraM:+o.alturaM)||1,x=Number(o.x)*W/28,y=Number(o.y)*H/14;
  if(Math.abs(p.x-x)<=w/2+.05&&Math.abs(p.y-y)<=h/2+.05){const a=w*h;if(a<am){am=a;m=o;}}}
 return m;
}
// ---------------------------------------------------------------- objetos da cena (formato da mesa: x,y normalizados 28×14)
let seq=0;const novoId=t=>'o3_'+t+'_'+Date.now().toString(36)+(seq++).toString(36);
const N=(r,W,H)=>({x:+((r.x+r.w/2)*28/W).toFixed(4),y:+((r.y+r.h/2)*14/H).toFixed(4),larguraM:+r.w.toFixed(3),alturaM:+r.h.toFixed(3)});
const tex=t=>t?{textura:t.src,texturaM:Number(t.tamM)||2,texturaId:t.id}:{};
export function objParede(r,t,W,H,{nome='Parede',cor='#6b6158'}={}){const [mat,dur]=MATERIAL[t?.id]||['pedra',12];return {id:novoId('parede'),nome,forma:'rect',cor,borda:'#2a2622',bordaLargura:1,...N(r,W,H),angulo:0,camada:3,bloqueiaMovimento:true,bloqueiaVisao:true,pvMax:300,pvAtual:300,dureza:dur,material:mat,...tex(t),oficina3:'parede'};}
export function objChao(r,t,W,H){return {id:novoId('chao'),nome:'Chão'+(t?' · '+t.nome:''),forma:'rect',cor:'#8a7a66',bordaLargura:0,...N(r,W,H),angulo:0,camada:1,bloqueiaMovimento:false,bloqueiaVisao:false,pvMax:0,pvAtual:0,dureza:0,material:'',...tex(t),oficina3:'chao'};}
export function objTeto(r,t,W,H){return {id:novoId('teto'),nome:'Telhado · '+(t?.nome||'teto'),forma:'rect',cor:'#7a3a2a',borda:'#3a1a12',bordaLargura:1,...N(r,W,H),angulo:0,camada:5,bloqueiaMovimento:false,bloqueiaVisao:false,tetoV139:true,pvMax:0,pvAtual:0,dureza:0,material:'',...tex(t),oficina3:'teto'};}
export function objPorta(r,t,W,H){return {id:novoId('porta'),nome:'Porta',forma:'rect',cor:'#7a4e2a',borda:'#2e1c0e',bordaLargura:1,...N(r,W,H),angulo:0,camada:3,bloqueiaMovimento:true,bloqueiaVisao:true,pvMax:60,pvAtual:60,dureza:6,material:'madeira',...tex(t),oficina3:'porta'};}
export function objJanela(r,W,H){return {id:novoId('janela'),nome:'Janela',forma:'rect',cor:'#9fd3ff',borda:'#2a3a48',bordaLargura:1,opacity:.85,...N(r,W,H),angulo:0,camada:3,bloqueiaMovimento:true,bloqueiaVisao:false,pvMax:10,pvAtual:10,dureza:2,material:'vidro',oficina3:'janela'};}
export function objEscada(r,t,W,H){return {id:novoId('escada'),nome:'Escada',forma:'rect',cor:'#8a7a66',bordaLargura:0,...N(r,W,H),angulo:0,camada:1,bloqueiaMovimento:false,bloqueiaVisao:false,pvMax:0,pvAtual:0,dureza:0,material:'',...(t?{textura:t.src,texturaM:.6,texturaId:t.id}:{}),oficina3:'escada'};}
export function objBloqueio(r,W,H,visao=false){return {id:novoId('bloq'),nome:'Bloqueio',forma:'rect',cor:'#3a2a1a',bordaLargura:0,opacity:0,invisivelV161:true,...N(r,W,H),angulo:0,camada:3,bloqueiaMovimento:true,bloqueiaVisao:!!visao,pvMax:0,pvAtual:0,dureza:0,material:'',oficina3:'bloqueio'};}
export function objDoBanco(m,p,W,H,rot=0){const w=Number(m.larguraM)||1,h=Number(m.alturaM)||1;return {id:novoId('obj'),nome:String(m.nome||m.id),modeloId:String(m.id),objetoBancoId:String(m.id),imagem:String(m.imagem||''),x:+(p.x*28/W).toFixed(4),y:+(p.y*14/H).toFixed(4),larguraM:w,alturaM:h,angulo:rot,camada:Number(m.camada)||3,bloqueiaMovimento:m.bloqueiaMovimento!==false&&m.bloqueiaMovimento!==undefined?!!m.bloqueiaMovimento:false,bloqueiaVisao:!!m.bloqueiaVisao,pvMax:Number(m.pvMax)||0,pvAtual:Number(m.pvMax)||0,dureza:Number(m.dureza)||0,material:String(m.material||''),...(m.tetoV139?{tetoV139:true}:{}),oficina3:'objeto'};}
// metros do objeto (retângulo sem giro de 90°)
export function retDoObjeto(o,W,H){const g=Math.abs(Math.round((Number(o.angulo)||0)/90))%2===1,w=(g?+o.alturaM:+o.larguraM)||1,h=(g?+o.larguraM:+o.alturaM)||1;return {x:Number(o.x)*W/28-w/2,y:Number(o.y)*H/14-h/2,w,h};}

const ESTILO=`
#o3Botao{border-radius:999px;border:1px solid #ffb86b;background:#2a1a0a;color:#ffe2bf;padding:6px 12px;font:600 13px 'Segoe UI',Arial,sans-serif;cursor:pointer}
#o3Botao[aria-pressed="true"]{background:#5a3412;box-shadow:0 0 0 2px #ffb86b55}
#o3Painel{box-sizing:border-box;margin:6px 0 0;border:1px solid #6b4a2a;border-radius:12px;background:#140f0a;color:#f3e6d6;font:12.5px 'Segoe UI',Arial,sans-serif;height:176px;display:flex;flex-direction:column;overflow:hidden}
#o3Painel[hidden]{display:none}
#o3Painel .o3-abas{display:flex;gap:4px;padding:5px 6px 0;align-items:center;flex:0 0 auto}
#o3Painel .o3-abas button{border:1px solid #5a3e22;border-bottom:none;border-radius:8px 8px 0 0;background:#1f160e;color:#e8d3bb;padding:4px 10px;cursor:pointer;font:600 12.5px 'Segoe UI',Arial,sans-serif}
#o3Painel .o3-abas button[aria-pressed="true"]{background:#3a2814;color:#fff}
#o3Painel .o3-abas .o3-dir{margin-left:auto;display:flex;gap:4px}
#o3Painel .o3-corpo{flex:1;overflow:auto;padding:6px 8px;border-top:1px solid #5a3e22;display:flex;flex-wrap:wrap;gap:5px;align-content:flex-start}
#o3Painel .o3-b{border:1px solid #5a3e22;border-radius:8px;background:#22180f;color:#f3e6d6;padding:4px 8px;cursor:pointer;font:12.5px 'Segoe UI',Arial,sans-serif;white-space:nowrap}
#o3Painel .o3-b[aria-pressed="true"]{background:#7a4a18;border-color:#ffb86b;color:#fff}
#o3Painel .o3-b:disabled{opacity:.45;cursor:default}
#o3Painel .o3-tex{width:44px;height:44px;border-radius:8px;border:2px solid #3a2814;background-size:cover;cursor:pointer;position:relative;flex:0 0 auto}
#o3Painel .o3-tex[aria-pressed="true"]{border-color:#ffb86b;box-shadow:0 0 0 2px #ffb86b66}
#o3Painel .o3-tex span{position:absolute;left:0;right:0;bottom:-1px;font-size:9.5px;text-align:center;background:#000a;border-radius:0 0 6px 6px;color:#fff}
#o3Painel .o3-obj{width:58px;height:58px;border-radius:8px;border:1px solid #3a2814;background:#0d0a07 center/contain no-repeat;cursor:pointer;position:relative;flex:0 0 auto}
#o3Painel .o3-obj[aria-pressed="true"]{border-color:#ffb86b;box-shadow:0 0 0 2px #ffb86b66}
#o3Painel .o3-obj span{position:absolute;left:0;right:0;bottom:0;font-size:9px;line-height:1.1;text-align:center;background:#000b;color:#fff;max-height:22px;overflow:hidden}
#o3Painel label{display:inline-flex;align-items:center;gap:4px;color:#d8c2a6}
#o3Painel input,#o3Painel select{background:#0d0a07;border:1px solid #5a3e22;border-radius:6px;color:#f3e6d6;padding:3px 5px;font:12px 'Segoe UI',Arial,sans-serif}
#o3Painel input[type=range]{padding:0;width:90px}
#o3Painel .o3-sep{width:1px;align-self:stretch;background:#3a2814;margin:0 3px}
#o3Painel .o3-st{flex:0 0 auto;padding:3px 8px;border-top:1px solid #3a2814;color:#d8c2a6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-height:18px}
#o3Previa{position:absolute;inset:0;pointer-events:none;z-index:45;overflow:visible}
#novaSyncBoard.o3-ativa{cursor:crosshair}
#o3Camada{position:absolute;inset:0;pointer-events:none;z-index:1;width:100%;height:100%}
#o3Avatar{position:absolute;aspect-ratio:1;transform:translate(-50%,-50%);z-index:46;pointer-events:none;display:grid;place-items:center}
#o3Avatar img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 2px 3px rgba(0,0,0,.45))}
#o3Avatar em{position:absolute;left:50%;top:100%;transform:translateX(-50%);font:600 10px Segoe UI,Arial,sans-serif;color:#ffe2bf;background:rgba(40,24,8,.8);padding:1px 6px;border-radius:8px;white-space:nowrap}
#o3Avatar i{position:absolute;inset:-28%;pointer-events:none}
#o3Avatar i::after{content:'';position:absolute;right:0;top:50%;transform:translateY(-50%);border:5px solid transparent;border-left:8px solid #ffb86b}
#o3Avatar.o3-fantasma{opacity:.6;border-style:dashed}
#o3Hud{position:fixed;left:50%;bottom:10px;transform:translateX(-50%);z-index:9990;width:min(860px,calc(100vw - 32px));text-align:center;box-sizing:border-box;background:rgba(20,15,10,.88);border:1px solid #6b4a2a;border-radius:10px;color:#f3e6d6;padding:5px 9px;font:12px 'Segoe UI',Arial,sans-serif;line-height:1.45;pointer-events:none}
#o3Hud small{color:#d8c2a6;font-size:11px}
#o3Hud .o3-sw{display:inline-block;width:11px;height:11px;border-radius:3px;vertical-align:-1px;margin-right:4px;border:1px solid #0008}
`;

export function instalarOficina3(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const el=id=>root.getElementById(id);
 const D=p=>dep.doc(dep.db,...p.split('/'));
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 const mapas=()=>{try{return dep.mapas?.()||[];}catch(_){return [];}};
 const mapa=()=>{try{return String(ctl()?.mapaAtual?.()||'');}catch(_){return '';}};
 const dims=()=>{try{const d=ctl()?.dimsAtual?.();return {W:Number(d?.W)||28,H:Number(d?.H)||14};}catch(_){return {W:28,H:14};}};
 if(!el('o3Css')){const s=root.createElement('style');s.id='o3Css';s.textContent=ESTILO;root.head.append(s);}
 let modPeca='',modMat='tijolo',modM=2,modGiro=0,modT=.3,cursor=null,ultPad=0; // v177: construção por módulos
 // v180: 👷 modo construtor — p/desl em metros; carga = peça sendo levada; pintura = material ou cor lisa
 const cons={ativo:false,p:{x:0,y:0},facing:0,desl:null,carga:null,pintura:'',atravessar:false,mapa:'',chegada:null,teclas:new Set(),pad:{x:0,y:0,m:0},raf:0,t:0,ultSaida:0,ultFant:0,ligs:[],pararLigs:null,avatar:null,hud:null,hudTxt:''};
 let aberto=false,aba='modulos',ferramenta='',status='',painel=null,botao=null,previa=null,camada=null;
 let esp=.3,larg=1,passo=.5,comTeto=true,visaoBloq=false,pincelW=1.5,pincelOp=.85,rot=0,objSel=null,busca='',destino='';
 let texPor={...PADRAO},custom=[],tracos=[],tracosMapa='',pararTracos=null,pararPinceis=null;
 const desfazer=[];
 try{const v=JSON.parse(win.localStorage?.getItem('mesa:oficina3')||'{}');if(v.texPor)texPor={...texPor,...v.texPor};if(v.esp)esp=+v.esp;if(v.larg)larg=+v.larg;if(v.pincelW)pincelW=+v.pincelW;if(v.modMat&&MATERIAIS.some(m=>m.id===v.modMat))modMat=v.modMat;if(v.modM)modM=+v.modM;if(v.modT)modT=+v.modT;}catch(_){}
 const lembrar=()=>{try{win.localStorage?.setItem('mesa:oficina3',JSON.stringify({texPor,esp,larg,pincelW,modMat,modM,modT}));}catch(_){}};
 const texturas=()=>[...TEXTURAS_BASE,...custom];
 const texDe=id=>texturas().find(t=>t.id===id)||null;
 const texAtual=()=>texDe(texPor[ferramenta]||texPor[ferramenta==='comodo'?'chao':'parede'])||null;
 const avisar=t=>{status=t;const s=painel?.querySelector('.o3-st');if(s)s.textContent=t;};

 // ------------------------------------------------------------ gravação ao vivo
 // v193: rascunho — diferença entre antes e depois vira edições (add/remove/properties) do editor da mesa; só vai ao mapa em 💾 Salvar mapa
 function diferencas(antes,depois){
  const A=new Map(antes.map(x=>[String(x.id),x])),B=new Map(depois.map(x=>[String(x.id),x])),ed=[];
  for(const [id,x] of B){const a=A.get(id);if(!a)ed.push({kind:'add',object:x});else if(JSON.stringify(a)!==JSON.stringify(x)){const p={};for(const k of new Set([...Object.keys(a),...Object.keys(x)]))if(JSON.stringify(a[k])!==JSON.stringify(x[k]))p[k]=x[k];ed.push({kind:'properties',id:x.id,properties:p});}}
  for(const [id,a] of A)if(!B.has(id))ed.push({kind:'remove',id:a.id});
  return ed;
 }
 const rasc=()=>{const r=win.mesaRascunhoMapaV193;return r&&win.mesaOficina3Imediato!==true&&r.ativo()&&r.mapaAtual()===mapa()?r:null;};
 async function mexerCena(fn,rotulo){
  const mid=mapa();if(!mid)throw Error('Nenhum mapa aberto.');
  const R=rasc();
  if(R){const antes=R.objetosAtuais(),res=fn([...antes]);const ed=diferencas(antes,res.objects);if(ed.length)R.empurrar(ed);
   if(res?.desfazer)desfazer.push({mid,...res.desfazer,rotulo});if(desfazer.length>60)desfazer.shift();
   avisar('✏️ '+R.pendentes+' alteração(ões) no rascunho — clique em 💾 Salvar mapa.');desenharPainel(false);return res;}
  let antes=null,depois=null,res=null;
  await dep.runTransaction(dep.db,async tx=>{
   const arqRef=D(ARQ(mid)),a=await tx.get(arqRef),s=await tx.get(D(SCENE));
   const ativa=s.exists()&&String(s.data()?.mapId||'')===mid;
   if(!ativa&&!a.exists())throw Error('Abra este mapa na mesa antes (aba 🗺️ Mapas → Abrir).');
   const base=ativa?s.data():a.data();antes=base;
   const r=fn([...(base.objects||[])]);res=r;
   depois={...base,mapId:mid,objetoSchema:1,objetosMapaImportados:true,objects:r.objects,editorRevision:Number(base.editorRevision||0)+1};
   if(JSON.stringify(depois).length>LIMITE_CENA)throw Error('O mapa ficou grande demais para a mesa: apague coisas antes de acrescentar.');
   if(ativa)tx.set(D(SCENE),clean(depois));tx.set(arqRef,clean(depois));
  });
  try{void win.mesaFixosV143_?.anotar?.(mid,antes,depois)?.catch?.(()=>{});}catch(_){}
  if(res?.desfazer)desfazer.push({mid,...res.desfazer,rotulo});if(desfazer.length>60)desfazer.shift();
  desenharPainel(false);return res;
 }
 const acrescentar=(lista,rotulo)=>mexerCena(objs=>({objects:[...objs,...lista],desfazer:{tirar:lista.map(o=>o.id)}}),rotulo);
 async function gravarTracos(fn,rotulo){
  const mid=mapa();if(!mid)return;let undo=null;
  await dep.runTransaction(dep.db,async tx=>{const r=D(DOC_TRACOS(mid)),s=await tx.get(r);const lista=s.exists()?(s.data()?.tracos||[]):[];const out=fn(lista);undo=out.desfazer;
   if(JSON.stringify(out.tracos).length>900000)throw Error('Pinceladas demais neste mapa: apague algumas.');tx.set(r,clean({mapId:mid,tracos:out.tracos,em:Date.now()}));});
  if(undo)desfazer.push({mid,...undo,rotulo});desenharPainel(false);
 }
 async function voltar(){
  const u=desfazer.pop();if(!u){avisar('Nada para desfazer.');return;}
  if(u.mid!==mapa()){avisar('O último passo foi em outro mapa: abra-o para desfazer.');desfazer.push(u);return;}
  try{
   if(u.tirar||u.repor)await mexerCena(objs=>{let o=objs;if(u.tirar){const s=new Set(u.tirar);o=o.filter(x=>!s.has(String(x.id)));}if(u.repor)o=[...o.filter(x=>!u.repor.some(r=>r.id===x.id)),...u.repor];return {objects:o};});
   if(u.tracoTirar||u.tracoRepor)await gravarTracos(l=>({tracos:[...l.filter(t=>t.id!==u.tracoTirar),...(u.tracoRepor?[u.tracoRepor]:[])]}));
   avisar('↶ Desfeito: '+(u.rotulo||'último passo')+'.');
  }catch(e){avisar('⚠️ '+(e?.message||e));}
 }

 // ------------------------------------------------------------ pinceladas (todos veem)
 function camadaTracos(){
  const b=el('novaSyncBoard'),w=b?.querySelector('[data-world-layer]');if(!w)return;
  const mid=mapa();
  if(mid!==tracosMapa){tracosMapa=mid;tracos=[];try{pararTracos?.();}catch(_){}pararTracos=null;
   if(mid&&dep.onSnapshot)pararTracos=dep.onSnapshot(D(DOC_TRACOS(mid)),s=>{tracos=s.exists()&&String(s.data()?.mapId||'')===mid?(s.data()?.tracos||[]):[];pintarTracos();},()=>{});pintarTracos();}
  if(!camada||!camada.isConnected){camada=root.createElementNS('http://www.w3.org/2000/svg','svg');camada.id='o3Camada';camada.setAttribute('preserveAspectRatio','none');pintarTracos();}
  // logo acima do chão (pintura de fundo e pisos, camadas 0–1) e abaixo de paredes, móveis e miniaturas
  let chao=null,zc=0;for(const n of w.children){if(!n.dataset?.sceneObject)continue;const c=Number(n.dataset.camada),z=Number(n.style.zIndex)||0;if(c<=1&&z>=zc){zc=z;chao=n;}}
  if(chao){if(camada.previousElementSibling!==chao)chao.after(camada);if(camada.style.zIndex!==String(zc))camada.style.zIndex=String(zc);}
  else{if(w.firstElementChild!==camada)w.prepend(camada);if(camada.style.zIndex!=='1')camada.style.zIndex='1';}
 }
 function pintarTracos(){
  if(!camada)return;const {W,H}=dims();camada.setAttribute('viewBox',`0 0 ${W} ${H}`);
  const usados=new Map();for(const t of tracos)if(t.src&&!usados.has(t.src))usados.set(t.src,{id:'o3p'+usados.size,tam:Number(t.tam)||2});
  let h='<defs>';for(const [src,p] of usados)h+=`<pattern id="${p.id}" patternUnits="userSpaceOnUse" width="${p.tam}" height="${p.tam}"><image href="${esc(src)}" width="${p.tam}" height="${p.tam}" preserveAspectRatio="none"/></pattern>`;h+='</defs>';
  for(const t of tracos){const pts=t.pts||[];if(!pts.length)continue;const p=usados.get(t.src);const d='M'+pts.map(q=>q[0]+' '+q[1]).join(' L');
   h+=`<path d="${d}${pts.length===1?' l0.01 0':''}" fill="none" stroke="${p?`url(#${p.id})`:'#7a6a50'}" stroke-width="${Number(t.w)||1}" stroke-linecap="round" stroke-linejoin="round" opacity="${Number(t.op)||1}"/>`;}
  camada.innerHTML=h;
 }

 // ------------------------------------------------------------ painel (faixa fora do mapa)
 function montarBotao(){
  const b=el('novaSyncBoard'),sc=b?.parentElement;
  if(!ehMestre()||!sc){botao?.remove();botao=null;if(painel)painel.hidden=true;return;}
  if(false&&(!botao||!botao.isConnected)){botao=root.createElement('button');botao.type='button';botao.id='o3Botao'; /* v201: sem botão — o Editor rápido substitui a Oficina 3.0 */botao.textContent='🏗️ Oficina 3.0';botao.title='Construir o mapa ao vivo (paredes, cômodos, chão, teto, portas, pincéis, objetos)';
   botao.addEventListener('pointerdown',e=>e.stopPropagation());botao.addEventListener('click',()=>alternar());
   if(getComputedStyle(sc).position==='static')sc.style.position='relative';sc.append(botao);}
  botao?.setAttribute('aria-pressed',String(aberto));
 }
 function alternar(v){aberto=typeof v==='boolean'?v:!aberto;if(!aberto){if(cons.ativo)sairConstrutor();escolher('');}montarPainel();desenharPainel(true);botao?.setAttribute('aria-pressed',String(aberto));}
 function montarPainel(){
  const b=el('novaSyncBoard'),sc=b?.parentElement;if(!sc)return;
  if(!painel){painel=root.createElement('section');painel.id='o3Painel';painel.setAttribute('aria-label','Oficina 3.0');painel.hidden=true;
   painel.addEventListener('pointerdown',e=>e.stopPropagation());painel.addEventListener('click',aoClicar);painel.addEventListener('input',aoMudar);painel.addEventListener('change',aoMudar);}
  // embaixo do mapa (depois da faixa de baixo): abrir não empurra o mapa
  const base=el('mbBase'),depois=base&&base.parentElement===sc.parentElement?base:sc;
  if(painel.previousElementSibling!==depois)depois.after(painel);
  painel.hidden=!aberto;
 }
 const B=(f,txt,tit)=>`<button type="button" class="o3-b" data-f="${f}" aria-pressed="${ferramenta===f}" title="${esc(tit)}">${txt}</button>`;
 function texHtml(){const sel=texPor[ferramenta]||'';return texturas().map(t=>`<button type="button" class="o3-tex" data-tex="${esc(t.id)}" aria-pressed="${sel===t.id}" title="${esc(t.nome)}${t.custom?' (seu pincel)':''}" style="background-image:url('${esc(t.src)}')"><span>${esc(t.nome)}</span></button>`).join('');}
 function desenharPainel(tudo){
  if(!painel||painel.hidden)return;
  const m=mapas().find(x=>String(x.id)===mapa());
  let corpo='';
  if(aba==='modulos'){
   const grupos=[['base','Chão'],['parede','Paredes'],['teto','Teto e escada'],['pronta','Prontas']];let n=0;
   corpo=`<span style="color:#ffb86b;font-weight:600">Material</span>`+MATERIAIS.map(m=>`<button type="button" class="o3-tex" data-mat="${m.id}" aria-pressed="${modMat===m.id}" title="${esc(m.nome)} (Q/E troca)" style="background-image:url('${texMat(m.id,'parede')}')"><span>${esc(m.nome)}</span></button>`).join('')+
    `<span class="o3-sep"></span><label title="Tamanho do módulo (cada peça)">Módulo <select data-mm>${[1,2,3,4].map(v=>`<option value="${v}"${v===modM?' selected':''}>${v} m</option>`).join('')}</select></label>`+
    `<label title="Espessura das paredes">Parede <select data-mt>${[.15,.2,.3,.5,1,1.5,2,3].concat([.15,.2,.3,.5,1,1.5,2,3].includes(modT)?[]:[modT]).sort((a,b)=>a-b).map(v=>`<option value="${v}"${v===modT?' selected':''}>${String(v).replace('.',',')} m</option>`).join('')}</select></label>`+
    `<button type="button" class="o3-b" data-giro title="Girar (R ou roda do mouse)">⟳ ${modGiro*90}°</button>`+B('apagar','🧽 Apagar','Clique no que quer tirar')+B('sel','↖ Mover','Selecionar e mover peças (o 🛠️ da mesa)')+
    `<span class="o3-sep"></span><button type="button" class="o3-b" data-construtor aria-pressed="${cons.ativo}" title="Andar com um construtor pelo mapa (controle ou WASD) e construir à frente dele, como no Conan Exiles">👷 Modo construtor</button><button type="button" class="o3-b" data-teste title="Abre (ou cria) dois mapas vazios ligados por uma saída, para treinar a construção">🧪 Mapas de teste</button>`+
    `<div style="flex-basis:100%;display:flex;flex-wrap:wrap;gap:5px;align-items:center">`+grupos.map(([g,t])=>`<span style="color:#d8c2a6;font-size:11.5px;margin-left:4px">${t}:</span>`+PECAS.filter(p=>p.grupo===g).map(p=>{n++;const k=n<=10?(n%10):'';return `<button type="button" class="o3-b" data-peca="${p.id}" aria-pressed="${ferramenta==='modulo'&&modPeca===p.id}" title="${esc(p.dica)}${k!==''?' · tecla '+k:''}">${p.icone} ${esc(p.nome)}${k!==''?` <small style="opacity:.6">${k}</small>`:''}</button>`;}).join('')).join('')+`</div>`;
  }else if(aba==='construir'){
   corpo=B('sel','↖ Selecionar','Selecionar, mover, girar e apagar (o 🛠️ da mesa)')+B('apagar','🧽 Apagar','Clique no que quer tirar (parede, chão, objeto, pincelada)')+'<span class="o3-sep"></span>'+
    B('parede','🧱 Parede','Arraste: parede reta (horizontal ou vertical)')+B('comodo','🏠 Cômodo','Arraste: chão + 4 paredes (+ teto)')+B('chao','⬛ Chão','Arraste: piso com textura')+B('teto','🔺 Teto','Arraste: telhado (some quando alguém entra)')+
    B('porta','🚪 Porta','Clique numa parede: abre um vão com porta (abre/fecha/tranca)')+B('janela','🪟 Janela','Clique numa parede: janela (barra o passo, deixa ver)')+B('escada','🪜 Escada','Arraste: escada/degraus')+B('bloqueio','⛔ Bloqueio','Arraste: área invisível que barra (para imagens)')+B('linha','╱ Bloqueio em linha','Arraste em qualquer ângulo: uma linha invisível que barra — para muros pintados na imagem do mapa')+
    '<span class="o3-sep"></span>'+
    `<label title="Espessura das paredes">Parede <select data-esp>${[.15,.2,.3,.5,1].map(v=>`<option value="${v}"${v===esp?' selected':''}>${String(v).replace('.',',')} m</option>`).join('')}</select></label>`+
    `<label title="Largura da porta/janela">Vão <select data-larg>${[.8,1,1.5,2,3].map(v=>`<option value="${v}"${v===larg?' selected':''}>${String(v).replace('.',',')} m</option>`).join('')}</select></label>`+
    `<label title="Encaixe na grade">Grade <select data-passo>${[.25,.5,1].map(v=>`<option value="${v}"${v===passo?' selected':''}>${String(v).replace('.',',')} m</option>`).join('')}</select></label>`+
    `<label><input type="checkbox" data-comteto ${comTeto?'checked':''}> cômodo com teto</label><label><input type="checkbox" data-visao ${visaoBloq?'checked':''}> bloqueio tapa a visão</label>`+
    (['parede','comodo','chao','teto','escada','porta'].includes(ferramenta)?'<span class="o3-sep"></span>'+(ferramenta==='comodo'?`<span style="color:#ffb86b">Chão:</span>`:'')+texHtml():'');
  }else if(aba==='pinceis'){
   const t=texDe(texPor.pincel);
   corpo=B('pincel','🖌️ Pincel','Pinte à mão livre com a textura escolhida')+B('apagar','🧽 Apagar','Clique numa pincelada para tirar')+
    `<label>Largura <input type="range" min="0.5" max="6" step="0.25" value="${pincelW}" data-pw> <b data-pwv>${String(pincelW).replace('.',',')} m</b></label>`+
    `<label>Força <input type="range" min="0.2" max="1" step="0.05" value="${pincelOp}" data-po></label>`+
    `<button type="button" class="o3-b" data-novo-pincel title="Acrescentar uma textura (imagem quadrada, sem emenda)">➕ Novo pincel</button>`+
    '<span class="o3-sep"></span>'+texturas().map(x=>`<button type="button" class="o3-tex" data-texp="${esc(x.id)}" aria-pressed="${texPor.pincel===x.id}" title="${esc(x.nome)}" style="background-image:url('${esc(x.src)}')"><span>${esc(x.nome)}</span></button>`).join('')+
    `<div data-form-pincel hidden style="flex-basis:100%;display:flex;gap:6px;align-items:center;flex-wrap:wrap"><label>Nome <input data-pn placeholder="ex.: palha seca" size="14"></label><label>Imagem <input type="file" accept="image/*" data-pf></label><label>Cada ladrilho cobre <select data-pt>${[1,2,3,4,6].map(v=>`<option value="${v}"${v===2?' selected':''}>${v} m</option>`).join('')}</select></label><button type="button" class="o3-b" data-salvar-pincel>💾 Guardar pincel</button></div>`;
   if(!t)texPor.pincel=PADRAO.pincel;
  }else if(aba==='objetos'){
   const q=sem(busca),lista=(dep.objetos?.()||[]).filter(o=>o&&o.id&&o.imagem&&(!q||sem(o.nome+' '+o.id+' '+(o.categoria||'')).includes(q))).slice(0,140);
   corpo=`<label>Procurar <input type="search" data-busca value="${esc(busca)}" placeholder="cadeira, barril, nave…" size="18"></label><button type="button" class="o3-b" data-rot title="Girar 90° (tecla R)">⟳ ${rot}°</button>`+B('apagar','🧽 Apagar','Clique no objeto para tirar')+B('sel','↖ Selecionar','Mover/girar/redimensionar (🛠️)')+'<span class="o3-sep"></span>'+
    lista.map(o=>`<button type="button" class="o3-obj" data-obj="${esc(o.id)}" aria-pressed="${objSel===String(o.id)}" title="${esc(o.nome)} · ${Number(o.larguraM)||1}×${Number(o.alturaM)||1} m" style="background-image:url('${esc(o.imagem)}')"><span>${esc(o.nome)}</span></button>`).join('')||'<span>Nenhum objeto.</span>';
  }else if(aba==='mapas'){
   const ops=mapas().filter(x=>x?.id&&!/^__/.test(String(x.id))&&(!x.arquivadoV176||String(x.id)===mapa())).sort((a,b)=>String(a.nome||a.id).localeCompare(String(b.nome||b.id),'pt'));
   corpo=`<span>Aberto: <b>${esc(m?.nome||mapa()||'—')}</b> ${m?`(${Number(m.larguraM)||28}×${Number(m.alturaM)||14} m)`:''}</span>`+
    `<label>Renomear <input data-rn value="${esc(m?.nome||'')}" size="18"></label><button type="button" class="o3-b" data-renomear>✏️</button>`+
    '<span class="o3-sep"></span>'+
    `<label>Abrir <select data-abrir-sel>${ops.map(x=>`<option value="${esc(x.id)}"${String(x.id)===mapa()?' selected':''}>${esc(x.nome||x.id)}</option>`).join('')}</select></label><button type="button" class="o3-b" data-abrir>📂 Abrir</button>`+
    '<span class="o3-sep"></span>'+
    `<label>🚪 Saída para <select data-destino><option value="">— escolha —</option>${ops.filter(x=>String(x.id)!==mapa()).map(x=>`<option value="${esc(x.id)}"${String(x.id)===destino?' selected':''}>${esc(x.nome||x.id)}</option>`).join('')}</select></label>`+B('saida','📍 Marcar a saída','Depois clique no mapa onde fica a porta/saída')+
    `<div style="flex-basis:100%;display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:2px"><b style="color:#ffb86b">➕ Mapa novo</b><label>Nome <input data-nn placeholder="ex.: Casa do Sérgio" size="16"></label><label>Largura <input type="number" data-nw value="28" min="6" max="120" style="width:58px"> m</label><label>Altura <input type="number" data-nh value="20" min="6" max="120" style="width:58px"> m</label><label>Chão <select data-nc><option value="">liso</option>${texturas().map(t=>`<option value="${esc(t.id)}">${esc(t.nome)}</option>`).join('')}</select></label><button type="button" class="o3-b" data-criar>Criar e abrir</button></div>`;
  }
  const abas=[['modulos','🏠 Construir'],['construir','✏️ Desenhar livre'],['pinceis','🖌️ Pincéis'],['objetos','📦 Objetos'],['mapas','🗺️ Mapas']];
  const html=`<div class="o3-abas">${abas.map(([k,t])=>`<button type="button" data-aba="${k}" aria-pressed="${aba===k}">${t}</button>`).join('')}<span class="o3-dir">${(win.mesaRascunhoMapaV193?.pendentes||0)>0?`<button type="button" class="o3-b" data-salvarmapa title="Grava no mapa tudo o que foi construído" style="background:#2d5a2d;border-color:#7fe08a">💾 Salvar mapa (${win.mesaRascunhoMapaV193.pendentes})</button><button type="button" class="o3-b" data-descartarmapa title="Joga fora o que ainda não foi salvo">🗑️ Descartar</button>`:''}<button type="button" class="o3-b" data-desfazer ${desfazer.length?'':'disabled'} title="Desfazer (Ctrl+Z)">↶ Desfazer</button><button type="button" class="o3-b" data-fechar title="Fechar a oficina">✕</button></span></div><div class="o3-corpo">${corpo}</div><div class="o3-st">${esc(status||dica())}</div>`;
  const sc=painel.querySelector('.o3-corpo'),top=sc?.scrollTop||0;painel.innerHTML=html;const nc=painel.querySelector('.o3-corpo');if(nc&&!tudo)nc.scrollTop=top;
  const bs=painel.querySelector('[data-busca]');if(bs&&root.activeElement?.dataset?.busca===undefined&&aba==='objetos'&&focoBusca){bs.focus();bs.setSelectionRange(bs.value.length,bs.value.length);}
 }
 let focoBusca=false;
 function dica(){
  return {parede:'🧱 Arraste no mapa para levantar uma parede.',comodo:'🏠 Arraste um retângulo: vira um cômodo (chão, paredes e teto). Depois 🚪 abre a porta.',chao:'⬛ Arraste para cobrir o chão com a textura.',teto:'🔺 Arraste o telhado: quem entra embaixo deixa de vê-lo.',
   porta:'🚪 Clique numa parede onde quer a porta.',janela:'🪟 Clique numa parede onde quer a janela.',escada:'🪜 Arraste a escada.',bloqueio:'⛔ Arraste a área que barra a passagem (fica invisível; aparece no 🛠️).',linha:'╱ Arraste por cima de um muro pintado: vira uma linha invisível que barra.',
   apagar:'🧽 Clique no que quer tirar. ↶ Desfazer volta.',modulo:'🏠 Clique para pôr · R ou roda: gira · Q/E: material · 1–0: peça · Esc: sai · Controle: D-pad move, A põe, B sai, LB/RB gira, X material, Y peça.',pincel:'🖌️ Pinte segurando o botão do mouse.',colocar:'📦 Clique no mapa para colocar. R gira. Esc para.',saida:'📍 Clique no mapa onde fica a saída.'}[ferramenta]||
   'Tudo o que você faz aqui já vale no mapa aberto, para todos. ↖ Selecionar = mover/girar/apagar pelo 🛠️ da mesa.';
 }
 function escolher(f){
  if(f==='sel'){ferramenta='';objSel=null;const bt=root.querySelector('[data-a="editar"]');if(bt&&bt.getAttribute('aria-pressed')!=='true')bt.click();status='↖ Use o 🛠️ da mesa: clique para selecionar, arraste para mover; a lateral tem girar, duplicar e apagar.';}
  else{ferramenta=ferramenta===f?'':f;if(ferramenta!=='colocar')objSel=null;status='';if(ferramenta){const bt=root.querySelector('[data-a="editar"]');if(bt&&bt.getAttribute('aria-pressed')==='true')bt.click();}}
  el('novaSyncBoard')?.classList.toggle('o3-ativa',!!ferramenta);limparPrevia();desenharPainel(false);
 }
 async function aoClicar(e){
  const t=e.target.closest('button');if(!t)return;
  if(t.dataset.aba){aba=t.dataset.aba;if(!['modulos','construir','pinceis','objetos','mapas'].includes(aba))aba='modulos';if(ferramenta&&!(aba==='pinceis'&&ferramenta==='pincel'))escolher('');desenharPainel(true);return;}
  if(t.dataset.mat){modMat=t.dataset.mat;lembrar();desenharPainel(false);fantasma();return;}
  if(t.dataset.peca){if(ferramenta==='modulo'&&modPeca===t.dataset.peca){escolher('');return;}modPeca=t.dataset.peca;ferramenta='modulo';objSel=null;status='';const bt=root.querySelector('[data-a="editar"]');if(bt&&bt.getAttribute('aria-pressed')==='true')bt.click();el('novaSyncBoard')?.classList.add('o3-ativa');desenharPainel(false);fantasma();return;}
  if(t.dataset.giro!==undefined){modGiro=(modGiro+1)%4;desenharPainel(false);fantasma();return;}
  if(t.dataset.fechar!==undefined)return alternar(false);
  if(t.dataset.desfazer!==undefined)return voltar();
  if(t.dataset.f)return escolher(t.dataset.f);
  if(t.dataset.tex){texPor[ferramenta]=t.dataset.tex;lembrar();desenharPainel(false);return;}
  if(t.dataset.texp){texPor.pincel=t.dataset.texp;lembrar();if(ferramenta!=='pincel')escolher('pincel');else desenharPainel(false);return;}
  if(t.dataset.obj){objSel=t.dataset.obj;ferramenta='colocar';el('novaSyncBoard')?.classList.add('o3-ativa');status='';desenharPainel(false);return;}
  if(t.dataset.rot!==undefined){rot=(rot+90)%360;desenharPainel(false);return;}
  if(t.dataset.novoPincel!==undefined){const f=painel.querySelector('[data-form-pincel]');if(f)f.hidden=!f.hidden;return;}
  if(t.dataset.salvarPincel!==undefined)return salvarPincel();
  if(t.dataset.renomear!==undefined)return renomear();
  if(t.dataset.abrir!==undefined){const id=painel.querySelector('[data-abrir-sel]')?.value;if(id)try{await ctl()?.openMap?.(id);avisar('📂 Mapa aberto.');setTimeout(()=>desenharPainel(false),900);}catch(err){avisar('⚠️ '+(err?.message||err));}return;}
  if(t.dataset.criar!==undefined)return criarMapa();
  if(t.dataset.salvarmapa!==undefined){try{avisar('⏳ Salvando o mapa…');await win.mesaRascunhoMapaV193.salvar();avisar('✔ Mapa salvo e sincronizado.');}catch(err){avisar('⚠️ '+(err?.message||err));}desenharPainel(false);return;}
  if(t.dataset.descartarmapa!==undefined){if(win.confirm('Descartar o que ainda não foi salvo?')){win.mesaRascunhoMapaV193.descartar();avisar('🗑️ Rascunho descartado.');}desenharPainel(false);return;}
  if(t.dataset.construtor!==undefined)return cons.ativo?sairConstrutor():entrarConstrutor();
  if(t.dataset.teste!==undefined)return abrirTeste();
 }
 function aoMudar(e){
  const t=e.target;
  if(t.dataset.mm!==undefined){modM=+t.value;lembrar();fantasma();}
  else if(t.dataset.mt!==undefined){modT=+t.value;lembrar();fantasma();}
  else if(t.dataset.esp!==undefined){esp=+t.value;lembrar();}
  else if(t.dataset.larg!==undefined){larg=+t.value;lembrar();}
  else if(t.dataset.passo!==undefined)passo=+t.value;
  else if(t.dataset.comteto!==undefined)comTeto=t.checked;
  else if(t.dataset.visao!==undefined)visaoBloq=t.checked;
  else if(t.dataset.pw!==undefined){pincelW=+t.value;lembrar();const v=painel.querySelector('[data-pwv]');if(v)v.textContent=String(pincelW).replace('.',',')+' m';}
  else if(t.dataset.po!==undefined)pincelOp=+t.value;
  else if(t.dataset.busca!==undefined&&e.type==='input'){busca=t.value;focoBusca=true;desenharPainel(false);focoBusca=false;}
  else if(t.dataset.destino!==undefined){destino=t.value;}
 }
 async function salvarPincel(){
  const nome=String(painel.querySelector('[data-pn]')?.value||'').trim(),f=painel.querySelector('[data-pf]')?.files?.[0],tam=+(painel.querySelector('[data-pt]')?.value||2);
  if(!nome||!f){avisar('Dê um nome e escolha a imagem.');return;}
  if(!dep.enviarImagem){avisar('⚠️ Envio de imagens indisponível aqui.');return;}
  try{avisar('Enviando a imagem…');const src=await dep.enviarImagem(f);const id='c_'+sem(nome).replace(/[^a-z0-9]+/g,'_').slice(0,30)+'_'+Date.now().toString(36);
   const s=await dep.getDoc(D(DOC_PINCEIS));const lista=s.exists()?(s.data()?.lista||[]):[];
   await dep.setDoc(D(DOC_PINCEIS),clean({lista:[...lista,{id,nome,src,tamM:tam,custom:true,em:Date.now()}]}));
   texPor.pincel=id;lembrar();avisar(`✅ Pincel "${nome}" guardado. Ele também serve para paredes, chão e teto.`);}catch(err){avisar('⚠️ '+(err?.message||err));}
 }
 async function renomear(){
  const id=mapa(),nome=String(painel.querySelector('[data-rn]')?.value||'').trim();if(!id||!nome)return;
  try{await dep.setDoc(D('mapas/'+id),{nome},{merge:true});const m=mapas().find(x=>String(x.id)===id);if(m)m.nome=nome;
   try{const sh=await dep.getDoc(D('combatesAtivos/mapaMesaSyncDireta'));if(sh.exists()&&String(sh.data()?.mapId||'')===id)await dep.setDoc(D('combatesAtivos/mapaMesaSyncDireta'),{nome},{merge:true});}catch(_){}
   try{win.labAtualizarSelectMapas_?.();}catch(_){}avisar('✏️ Mapa renomeado.');}catch(err){avisar('⚠️ '+(err?.message||err));}
 }
 async function criarMapaBase(nome,w,h,tid){
  const api=win.mesaMapasV110_;if(!api?.salvar)throw Error('Ainda carregando os mapas; tente de novo.');
  const t=texDe(tid),state={w,h,ppm:40,bg:'#3a3530',texture:'nenhuma',showGrid:false,grid:'#777777',name:nome,formatoObjetos:'refs-v1',elements:[],oficina3V175:true};
  const r=await api.salvar({nome,state,cenaDe:id=>{const c=cenaDoEstado(state,id);if(t)c.objects=[...(c.objects||[]),{...objChao({x:0,y:0,w,h},t,w,h),nome:'Chão do mapa',camada:0}];return JSON.stringify(c).length<=LIMITE_CENA?c:null;}});
  const id=String(r?.id||'');if(!id)throw Error('o mapa não voltou com id');return id;
 }
 async function criarMapa(){
  const nome=String(painel.querySelector('[data-nn]')?.value||'').trim(),w=Math.max(6,Math.min(120,+(painel.querySelector('[data-nw]')?.value||28))),h=Math.max(6,Math.min(120,+(painel.querySelector('[data-nh]')?.value||20))),tid=painel.querySelector('[data-nc]')?.value||'';
  if(!nome){avisar('Dê um nome ao mapa novo.');return;}
  try{avisar('Criando…');const id=await criarMapaBase(nome,w,h,tid);
   await ctl()?.openMap?.(id);avisar(`✅ "${nome}" criado e aberto (${w}×${h} m). Agora é construir.`);aba='construir';setTimeout(()=>desenharPainel(true),800);
  }catch(err){avisar('⚠️ '+(err?.message||err));}
 }

 // ------------------------------------------------------------ desenho no mapa
 function ponto(e){const b=el('novaSyncBoard'),r=b.getBoundingClientRect(),{W,H}=dims();return {x:Math.max(0,Math.min(W,(e.clientX-r.left)/r.width*W)),y:Math.max(0,Math.min(H,(e.clientY-r.top)/r.height*H))};}
 function garantirPrevia(){const b=el('novaSyncBoard');if(!b)return null;if(!previa||previa.parentElement!==b){previa?.remove();previa=root.createElementNS('http://www.w3.org/2000/svg','svg');previa.id='o3Previa';previa.setAttribute('preserveAspectRatio','none');b.append(previa);}
  const {W,H}=dims();previa.setAttribute('viewBox',`0 0 ${W} ${H}`);return previa;}
 function limparPrevia(){if(previa)previa.innerHTML='';}
 function mostrar(rs,{cor='#ffb86b',pts=null,w=1}={}){const p=garantirPrevia();if(!p)return;let h='';
  for(const r of rs)h+=`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${cor}33" stroke="${cor}" stroke-width="0.06" stroke-dasharray="0.25 0.15"/>`;
  if(pts&&pts.length)h+=`<path d="M${pts.map(q=>q[0]+' '+q[1]).join(' L')}" fill="none" stroke="${cor}" stroke-opacity=".55" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  p.innerHTML=h;}
 let arrasto=null;
 const ARRASTA=new Set(['parede','comodo','chao','teto','escada','bloqueio','linha','pincel']);
 function retDe(a,b){return ferramenta==='parede'?paredeEntre(a,b,esp,passo):retDeArrasto(a,b,passo);}
 function previaDe(a,b){const r=retDe(a,b);if(ferramenta==='comodo')return [r,...paredesDoComodo(r,esp)];return [r];}
 root.addEventListener('pointerdown',e=>{
  if(!aberto||!ferramenta||!ehMestre())return;const b=el('novaSyncBoard');if(!b||!b.contains(e.target)||e.button!==0)return;
  if(e.target.closest?.('#camZoom,#camPan,.ml-saida,#mbLateral,#mbPropriedades'))return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation?.();
  const p=ponto(e);
  if(ARRASTA.has(ferramenta)){arrasto={a:p,b:p,id:e.pointerId,pts:[[p.x,p.y]]};try{b.setPointerCapture?.(e.pointerId);}catch(_){}if(ferramenta==='pincel')mostrar([],{pts:arrasto.pts,w:pincelW});else mostrar(previaDe(p,p));return;}
  void clique(p);
 },true);
 root.addEventListener('pointermove',e=>{
  if(!arrasto||e.pointerId!==arrasto.id)return;e.preventDefault();e.stopPropagation();const p=ponto(e);arrasto.b=p;
  if(ferramenta==='pincel'){const u=arrasto.pts[arrasto.pts.length-1];if(Math.hypot(p.x-u[0],p.y-u[1])>.12)arrasto.pts.push([p.x,p.y]);mostrar([],{pts:arrasto.pts,w:pincelW});}
  else if(ferramenta==='linha'){const pv=garantirPrevia();if(pv)pv.innerHTML=`<line x1="${arrasto.a.x}" y1="${arrasto.a.y}" x2="${p.x}" y2="${p.y}" stroke="#ff5a5a" stroke-width="${Math.max(.3,esp)}" stroke-linecap="round" opacity=".7"/>`;}
  else mostrar(previaDe(arrasto.a,p));
 },true);
 // v177: peça "fantasma" seguindo o mouse
 function fantasmaObjeto(){
  const m=(dep.objetos?.()||[]).find(x=>String(x.id)===objSel),p=garantirPrevia();if(!m||!p||!cursor)return;
  const w=Number(m.larguraM)||1,h=Number(m.alturaM)||1,x=encaixar(cursor.x,.25),y=encaixar(cursor.y,.25);
  p.innerHTML='<g transform="rotate('+rot+' '+x+' '+y+')"><rect x="'+(x-w/2)+'" y="'+(y-h/2)+'" width="'+w+'" height="'+h+'" fill="#ffb86b33" stroke="#ffb86b" stroke-width="0.06"/><image href="'+esc(m.imagem||'')+'" x="'+(x-w/2)+'" y="'+(y-h/2)+'" width="'+w+'" height="'+h+'" preserveAspectRatio="none" opacity=".8"/></g><circle cx="'+x+'" cy="'+y+'" r=".08" fill="#fff"/>';
 }
 function fantasma(){
  if(ferramenta==='colocar'&&cons.ativo&&objSel&&cursor){fantasmaObjeto();return;}
  if(ferramenta!=='modulo'||!modPeca||!cursor){if(ferramenta==='modulo'||(ferramenta==='colocar'&&cons.ativo))limparPrevia();return;}
  if(cons.ativo&&cons.carga){desenharCarga();return;}
  const c=contorno(modPeca,cursor,{M:modM,giro:giroEf(),t:modT}),cor=(cons.ativo&&(corLisa(cons.pintura)?.cor||pisoDe(cons.pintura)?.cor))||matDe(modMat).cor,p=garantirPrevia();if(!p)return;let h='';
  if(cons.ativo){const a=alvoAtual();if(a){const {W,H}=dims();for(const o of a.grupo.filter(x=>!x.invisivelV161)){const r=retDoObjeto(o,W,H);h+=`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="none" stroke="#ff6b6b" stroke-width="0.06" stroke-dasharray="0.18 0.12"/>`;}}}
  if(c.caixa)h+=`<rect x="${c.caixa.x}" y="${c.caixa.y}" width="${c.caixa.w}" height="${c.caixa.h}" fill="none" stroke="#ffffff55" stroke-width="0.04" stroke-dasharray="0.2 0.2"/>`;
  for(const r of c.rets)h+=`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${cor}66" stroke="#ffb86b" stroke-width="0.07"/>`;
  for(const l of c.linhas)h+=`<path d="M${l.map(q=>q.x+' '+q.y).join(' L')}" fill="none" stroke="${cor}" stroke-opacity=".8" stroke-width="${modT}" stroke-linecap="round"/><path d="M${l.map(q=>q.x+' '+q.y).join(' L')}" fill="none" stroke="#ffb86b" stroke-width="0.05"/>`;
  p.innerHTML=h;
 }
 root.addEventListener('pointermove',e=>{if(!aberto||ferramenta!=='modulo'||arrasto)return;const b=el('novaSyncBoard');if(!b||!b.contains(e.target))return;cursor=ponto(e);if(cons.ativo)cons.desl=limitarDesl({x:cursor.x-cons.p.x,y:cursor.y-cons.p.y});fantasma();},true);
 root.addEventListener('wheel',e=>{if(!aberto||ferramenta!=='modulo'||e.ctrlKey)return;const b=el('novaSyncBoard');if(!b||!b.contains(e.target))return;e.preventDefault();modGiro=(modGiro+(e.deltaY>0?1:3))%4;fantasma();desenharPainel(false);},{passive:false});
 root.addEventListener('pointerup',e=>{if(!arrasto||e.pointerId!==arrasto.id)return;e.preventDefault();e.stopPropagation();const a=arrasto;arrasto=null;void soltar(a).finally(limparPrevia);},true);
 root.addEventListener('click',e=>{if(aberto&&ferramenta&&el('novaSyncBoard')?.contains(e.target)){e.stopPropagation();e.preventDefault();}},true);
 root.addEventListener('keydown',e=>{
  if(!aberto||/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName||''))return;
  if(e.key==='Escape'&&ferramenta){escolher('');e.stopPropagation();}
  else if((e.key==='z'||e.key==='Z')&&(e.ctrlKey||e.metaKey)&&desfazer.length){e.preventDefault();void voltar();}
  else if((e.key==='r'||e.key==='R')&&ferramenta==='colocar'){rot=(rot+90)%360;desenharPainel(false);}
 });
 // v177: atalhos da construção (antes dos atalhos da mesa: 1–0 escolhem a peça, Q/E o material, R gira)
 root.addEventListener('keydown',e=>{
  if(!aberto||aba!=='modulos'||e.ctrlKey||e.altKey||e.metaKey||/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName||''))return;
  const k=String(e.key||'').toLowerCase();if(!(/^[0-9qer]$/.test(k)))return;e.preventDefault();e.stopImmediatePropagation();

   if(k==='r'&&ferramenta==='modulo'){modGiro=(modGiro+(e.shiftKey?3:1))%4;fantasma();desenharPainel(false);}
   else if((k==='q'||k==='e')&&cons.ativo)trocarPintura(k==='e'?1:-1);
   else if(k==='q'||k==='e'){const i=MATERIAIS.findIndex(m=>m.id===modMat);modMat=MATERIAIS[(i+(k==='e'?1:MATERIAIS.length-1))%MATERIAIS.length].id;lembrar();fantasma();desenharPainel(false);avisar('Material: '+matDe(modMat).nome);}
   else if(/^[0-9]$/.test(k)){const i=k==='0'?9:+k-1,pc=PECAS[i];if(pc){modPeca=pc.id;ferramenta='modulo';el('novaSyncBoard')?.classList.add('o3-ativa');fantasma();desenharPainel(false);avisar(pc.icone+' '+pc.nome+' — '+pc.dica);}}
  
 },true);
 async function soltar(a){
  const {W,H}=dims(),t=texAtual();
  try{
   if(ferramenta==='pincel'){const pts=simplificar(a.pts,.25);if(!pts.length)return;const tx=texDe(texPor.pincel);const tr={id:'tr'+Date.now().toString(36)+(seq++).toString(36),pts,w:pincelW,op:pincelOp,src:tx?.src||'',tam:tx?.tamM||2,tex:tx?.id||''};
    await gravarTracos(l=>({tracos:[...l,tr],desfazer:{tracoTirar:tr.id}}),'pincelada');return;}
   const r=retDe(a.a,a.b);
   if(ferramenta==='parede'){if(Math.max(r.w,r.h)<.6)return;await acrescentar([objParede(r,t,W,H)],'parede');avisar('🧱 Parede levantada.');}
   else if(ferramenta==='comodo'){if(r.w<1.5||r.h<1.5){avisar('Cômodo pequeno demais (mínimo 1,5 m).');return;}
    const tc=texDe(texPor.comodo),tp=texDe(texPor.parede),tt=texDe(texPor.teto);
    const lista=[objChao(r,tc,W,H),...paredesDoComodo(r,esp).map(q=>objParede(q,tp,W,H)),...(comTeto?[objTeto(r,tt,W,H)]:[])];
    await acrescentar(lista,'cômodo');avisar('🏠 Cômodo pronto. Use 🚪 Porta numa parede para entrar.');}
   else if(ferramenta==='chao'){await acrescentar([objChao(r,t,W,H)],'chão');}
   else if(ferramenta==='teto'){await acrescentar([objTeto(r,t,W,H)],'teto');}
   else if(ferramenta==='escada'){await acrescentar([objEscada(r,t,W,H)],'escada');}
   else if(ferramenta==='linha'){if(Math.hypot(a.b.x-a.a.x,a.b.y-a.a.y)<.4)return;const l=blocosLinha([a.a,a.b],Math.max(.3,esp),W,H,{visao:visaoBloq}).map(o=>({...o,nome:'Bloqueio',oficina3:'bloqueio'}));await acrescentar(l,'bloqueio em linha');avisar('╱ Linha que barra posta ('+l.length+' blocos invisíveis; no 🛠️ aparecem tracejados).');}
   else if(ferramenta==='bloqueio'){await acrescentar([objBloqueio(r,W,H,visaoBloq)],'bloqueio');avisar('⛔ Bloqueio posto (invisível; no 🛠️ aparece tracejado).');}
  }catch(err){avisar('⚠️ '+(err?.message||err));}
 }
 function jaTemIgual(lista){
  const v=lista.find(x=>!x.invisivelV161)||lista[0];if(!v)return false;
  return objsCena().some(x=>!x.invisivelV161&&x.nome===v.nome&&Math.abs(x.x-v.x)<.001&&Math.abs(x.y-v.y)<.001&&Math.abs(x.larguraM-v.larguraM)<.001&&Math.abs(x.alturaM-v.alturaM)<.001&&(Number(x.angulo)||0)===(Number(v.angulo)||0));
 }
 async function clique(p){
  const {W,H}=dims();
  try{
   if(ferramenta==='modulo'&&cons.ativo&&cons.carga){await soltarCarga();return;}
   if(ferramenta==='modulo'&&modPeca){const lista=colorir(montarPeca(modPeca,p,{M:modM,giro:giroEf(),t:modT,mat:modMat,W,H}),cons.ativo?cons.pintura:null);if(!lista.length)return;
    if(jaTemIgual(lista)){avisar('Já tem uma peça igual aqui.');return;}await acrescentar(lista,pecaDe(modPeca)?.nome||'peça');avisar(`✅ ${pecaDe(modPeca)?.icone||''} ${pecaDe(modPeca)?.nome} (${(cons.ativo&&corLisa(cons.pintura)?.nome)||matDe(modMat).nome}). ${cons.ativo?'Ande e ponha a próxima.':'Continue clicando; Esc para parar.'}`);return;}
   if(ferramenta==='colocar'){const m=(dep.objetos?.()||[]).find(o=>String(o.id)===objSel);if(!m)return;const q=cons.ativo?{x:encaixar(p.x,.25),y:encaixar(p.y,.25)}:p,novo=objDoBanco(m,q,W,H,rot);if(jaTemIgual([novo])){avisar('Já tem um igual aqui.');return;}await acrescentar([novo],m.nome||'objeto');avisar(`📦 ${m.nome} posto. Clique de novo para outro; Esc para parar.`);return;}
   if(ferramenta==='apagar'){
    const objs=objsCena();
    const o=objetoNoPonto(objs,p,W,H);
    if(o){await mexerCena(l=>({objects:l.filter(x=>String(x.id)!==String(o.id)),desfazer:{repor:[o]}}),'apagar '+(o.nome||''));avisar(`🧽 Tirado: ${o.nome||'objeto'}. ↶ Desfazer volta.`);return;}
    const tr=tracoPerto(tracos,p);if(tr){await gravarTracos(l=>({tracos:l.filter(x=>x.id!==tr.id),desfazer:{tracoRepor:tr}}),'apagar pincelada');avisar('🧽 Pincelada tirada.');return;}
    avisar('Nada aqui para tirar.');return;}
   if(ferramenta==='porta'||ferramenta==='janela'){
    const objs=objsCena();
    const par=objs.filter(o=>o.bloqueiaMovimento&&!o.destruido&&(o.oficina3==='parede'||(o.forma&&/parede|muro/i.test(String(o.nome||'')))||/^parede$/i.test(String(o.nome||'')))).map(o=>({o,r:retDoObjeto(o,W,H)})).filter(x=>p.x>=x.r.x-.35&&p.x<=x.r.x+x.r.w+.35&&p.y>=x.r.y-.35&&p.y<=x.r.y+x.r.h+.35).sort((a,b)=>a.r.w*a.r.h-b.r.w*b.r.h)[0];
    if(!par){avisar('Clique em cima de uma parede.');return;}
    const L=Math.min(larg,Math.max(par.r.w,par.r.h)-.1),v=abrirVao(par.r,p,L),tw=texDe(par.o.texturaId)||null;
    const pedacos=v.pedacos.map(q=>({...objParede(q,tw,W,H),nome:par.o.nome||'Parede',cor:par.o.cor||'#6b6158',...(par.o.textura?{textura:par.o.textura,texturaM:par.o.texturaM,texturaId:par.o.texturaId}:{})}));
    const novo=ferramenta==='porta'?objPorta(v.vao,texDe(texPor.porta),W,H):objJanela(v.vao,W,H);
    await mexerCena(l=>({objects:[...l.filter(x=>String(x.id)!==String(par.o.id)),...pedacos,novo],desfazer:{tirar:[...pedacos.map(x=>x.id),novo.id],repor:[par.o]}}),ferramenta);
    avisar(ferramenta==='porta'?'🚪 Porta posta (fechada). Clique nela na mesa para abrir, fechar ou trancar.':'🪟 Janela posta.');return;}
   if(ferramenta==='saida'){
    const alvo=destino||painel.querySelector('[data-destino]')?.value||'';if(!alvo){avisar('Escolha o mapa de destino em "🚪 Saída para".');return;}
    const s=await dep.getDoc(D('combatesAtivos/mesaLigacoes')),v=s.exists()?s.data()||{}:{},ligs=v.ligacoes||[];
    const aqui={x:+(p.x*28/W).toFixed(3),y:+(p.y*14/H).toFixed(3)},lado=ladoDoPonto(aqui),ocup=ligs.flatMap(l=>[l.a,l.b].filter(e=>String(e?.mapa)===alvo));
    let la=lado?pontoDeBorda(ocup.length,OPOSTO[lado]):{x:14,y:7};la=afastarNaBorda(la,ocup);
    const nova={id:'lig175_'+Date.now().toString(36),a:{mapa:mapa(),...aqui},b:{mapa:alvo,x:+la.x.toFixed(3),y:+la.y.toFixed(3)},tipo:'porta',oficina3:true};
    await dep.setDoc(D('combatesAtivos/mesaLigacoes'),clean({...v,ligacoes:[...ligs,nova],atualizadoEm:Date.now(),ladosV138:v.ladosV138||true}));
    const nm=mapas().find(x=>String(x.id)===alvo)?.nome||alvo;avisar(`🚪 Saída para "${nm}" criada (e a volta, do outro lado). Arraste a porta no 🕸️ Mapa geral se quiser mudar.`);escolher('');return;}
  }catch(err){avisar('⚠️ '+(err?.message||err));}
 }


 // ------------------------------------------------------------ v180: 👷 modo construtor
 // v196: com o rascunho ativo, colisão, mira, quebrar e pintar enxergam também o que ainda não foi salvo
 const objsCena=()=>{const r=rasc();if(r)return r.objetosAtuais();const c=ctl()?.cenaAtual?.();return c&&String(c.mapId||'')===mapa()?(c.objects||[]):[];};
 function giroEf(){
  if(!cons.ativo||!ehParede(modPeca))return modGiro;
  const dx=(cursor?.x??cons.p.x)-cons.p.x,dy=(cursor?.y??cons.p.y)-cons.p.y,ang=Math.hypot(dx,dy)>.05?Math.atan2(dy,dx):cons.facing;
  return (giroAuto(ang)+modGiro)%4;
 }
 // o que está sob a mira: para paredes, a borda onde a peça iria; para o resto, o ponto mirado
 function pontoAlvo(){if(!cursor)return null;if(ehParede(modPeca)){const c=contorno(modPeca,cursor,{M:modM,giro:giroEf(),t:modT}),r=c.rets?.[0];if(r)return {x:r.x+r.w/2,y:r.y+r.h/2};}return cursor;}
 function alvoAtual(){const pt=pontoAlvo();if(!pt)return null;const {W,H}=dims(),objs=objsCena(),o=alvoNaMira(objs,pt,W,H);return o?{o,grupo:grupoDaPeca(objs,o)}:null;}
 function deltaCarga(){const g=cons.carga;if(!g||!cursor)return {dx:0,dy:0};return {dx:encaixar(cursor.x-g.origem.x),dy:encaixar(cursor.y-g.origem.y)};}
 function desenharCarga(){const p=garantirPrevia();if(!p)return;const {W,H}=dims(),{dx,dy}=deltaCarga();let h='';
  for(const o of cons.carga.grupo.filter(x=>!x.invisivelV161)){const r=retDoObjeto(o,W,H),ang=Number(o.angulo)||0,cx=r.x+r.w/2+dx,cy=r.y+r.h/2+dy,giro=Math.abs(Math.round(ang/90))%2===1&&Math.abs(ang%90)<1;
   const w=giro?r.w:+o.larguraM||r.w,hh=giro?r.h:+o.alturaM||r.h,rot=giro?0:ang;
   h+=`<rect x="${cx-w/2}" y="${cy-hh/2}" width="${w}" height="${hh}" transform="rotate(${rot} ${cx} ${cy})" fill="${o.cor||'#999'}88" stroke="#7ee0ff" stroke-width="0.07"/>`;}
  p.innerHTML=h;}
 async function quebrar(){
  const a=alvoAtual();if(!a){avisar('🔨 Nada na mira para quebrar.');return;}
  const ids=new Set(a.grupo.map(o=>String(o.id)));
  try{await mexerCena(l=>({objects:l.filter(x=>!ids.has(String(x.id))),desfazer:{repor:a.grupo}}),'quebrar '+(a.o.nome||''));vibrarPad(.45,90);avisar(`🔨 Quebrado: ${a.o.nome||'peça'}. ↶ Desfazer (Back no controle, Ctrl+Z) traz de volta.`);}catch(e){avisar('⚠️ '+(e?.message||e));}
 }
 function pegar(){
  const a=alvoAtual();if(!a){avisar('✋ Nada na mira para levar.');return;}const {W,H}=dims();
  cons.carga={ids:new Set(a.grupo.map(o=>String(o.id))),grupo:a.grupo,origem:centroDe(a.grupo,W,H),nome:a.o.nome||'peça'};
  avisar(`✋ Levando: ${cons.carga.nome}. Ande até o lugar novo e aperte Y de novo (ou G / A / Enter) para largar · B cancela.`);fantasma();
 }
 async function soltarCarga(){
  const g=cons.carga;if(!g)return;const {W,H}=dims(),{dx,dy}=deltaCarga();cons.carga=null;
  if(!dx&&!dy){avisar('✋ Ficou no mesmo lugar.');fantasma();return;}
  const novos=new Map(deslocar(g.grupo,dx,dy,W,H).map(o=>[String(o.id),o]));
  try{await mexerCena(l=>({objects:l.map(o=>novos.get(String(o.id))||o),desfazer:{repor:g.grupo}}),'mover '+g.nome);vibrarPad(.25,60);avisar(`✋ ${g.nome} mudada de lugar.`);}catch(e){avisar('⚠️ '+(e?.message||e));}
  fantasma();
 }
 async function pintarAlvo(){
  const a=alvoAtual();if(!a){avisar('🎨 Nada na mira para pintar.');return;}
  const pid=cons.pintura||modMat,novos=new Map();for(const o of a.grupo){const n=pintar(o,pid);if(n)novos.set(String(o.id),n);}
  if(!novos.size){avisar('🎨 Isto é uma imagem do banco: não se pinta (troque pelo 📦 Objetos).');return;}
  const nome=PINTURAS.find(x=>x.id===pid)?.nome||pid;
  try{await mexerCena(l=>({objects:l.map(o=>novos.get(String(o.id))||o),desfazer:{repor:a.grupo}}),'pintar');vibrarPad(.2,50);avisar(`🎨 ${a.o.nome||'Peça'} agora: ${nome}.`);}catch(e){avisar('⚠️ '+(e?.message||e));}
 }
 function trocarPintura(passo){const i=Math.max(0,PINTURAS.findIndex(x=>x.id===(cons.pintura||modMat)));const n=PINTURAS[(i+passo+PINTURAS.length)%PINTURAS.length];cons.pintura=n.id;if(MATERIAIS.some(m=>m.id===n.id)){modMat=n.id;lembrar();}fantasma();desenharPainel(false);avisar((corLisa(n.id)?'🎨 Cor: ':'🧱 Material: ')+n.nome);}
 function trocarPeca(passo){const i=Math.max(0,PECAS.findIndex(p=>p.id===modPeca));modPeca=PECAS[(i+passo+PECAS.length)%PECAS.length].id;ferramenta='modulo';objSel=null;cons.carga=null;fantasma();desenharPainel(false);avisar(pecaDe(modPeca).icone+' '+pecaDe(modPeca).nome+' — '+pecaDe(modPeca).dica);}
 const vibrarPad=(f=.3,ms=60)=>{try{for(const gp of win.navigator.getGamepads?.()||[])gp?.vibrationActuator?.playEffect?.('dual-rumble',{duration:ms,strongMagnitude:f,weakMagnitude:f*.8});}catch(_){}};
 function inicioNoMapa(){
  const {W,H}=dims();
  if(cons.chegada&&String(cons.chegada.mapa)===mapa()){const c=chegadaDentro(cons.chegada,W,H);cons.chegada=null;return c;}
  try{const a=ctl()?.ator?.();if(a&&Number.isFinite(+a.x)&&String(a.mapaId||mapa())===mapa())return {x:+a.x*W/28,y:+a.y*H/14};}catch(_){}
  return {x:W/2,y:H/2};
 }
 // v195: o construtor é uma pessoa: miniatura montada pelo mesmo gerador das fichas (como o Kael), com nome próprio
 // visual próprio (capacete, colete amarelo, mochila de ferramentas), no mesmo gerador e no mesmo tamanho (porte 1) das fichas
 const SPEC_CONSTRUTOR={corpo:'humanoide',porte:1,pele:'#b9794a',roupa:'#e0a81c',roupa2:'#6a4a22',cabelo:'curto',corCabelo:'#2a1c12',cabeca:'capacete',armadura:'nenhuma',mochila:true,maoD:'nenhuma',maoE:'nenhuma'};
 let miniCons='';
 const miniaturaConstrutor=()=>{if(!miniCons){try{miniCons=svgParaDataUrl(renderizarMiniatura(SPEC_CONSTRUTOR));}catch(_){miniCons='';}}return miniCons;};
 function desenharAvatar(){
  const b=el('novaSyncBoard');if(!b)return;const {W,H}=dims();
  if(!cons.avatar||cons.avatar.parentElement!==b){cons.avatar?.remove();const a=root.createElement('div');a.id='o3Avatar';a.setAttribute('aria-label','Construtor');
   a.innerHTML='<i></i><img alt="" src="'+miniaturaConstrutor()+'"><em>'+esc(NOME_CONSTRUTOR)+'</em>';b.append(a);cons.avatar=a;}
  const a=cons.avatar,d=1.25; /* mesmo tamanho da miniatura das pessoas (1,25 m desenhados, v201) */ a.style.left=(cons.p.x/W*100)+'%';a.style.top=(cons.p.y/H*100)+'%';a.style.width=(d/W*100)+'%';
  a.style.fontSize=Math.max(8,b.offsetWidth*d/W*.62)+'px';a.firstChild.style.transform=`rotate(${cons.facing}rad)`;a.classList.toggle('o3-fantasma',cons.atravessar);
 }
 function desenharHud(){
  const b=el('novaSyncBoard'),sc=b?.parentElement;if(!sc)return;
  if(!cons.hud||!cons.hud.isConnected){cons.hud?.remove();cons.hud=root.createElement('div');cons.hud.id='o3Hud';root.body.append(cons.hud);cons.hudTxt='';}
  const pc=pecaDe(modPeca),pt=PINTURAS.find(x=>x.id===(cons.pintura||modMat));
  const txt=`<b>👷 ${esc(NOME_CONSTRUTOR)}</b> · ${cons.carga?'✋ levando '+esc(cons.carga.nome):ferramenta==='colocar'&&objSel?'🪑 '+esc((dep.objetos?.()||[]).find(x=>String(x.id)===objSel)?.nome||'objeto'):`${pc?pc.icone+' '+esc(pc.nome):''}`} · <span class="o3-sw" style="background:${pt?.cor||'#999'}"></span>${esc(pt?.nome||'')}${cons.atravessar?' · 👻 atravessando':''}<br><small>🎮 RT paleta (todas as peças, pisos, móveis) · A põe · X quebra · Y leva · LT pinta · ◀▶ peça · ▲▼ material/cor · LB/RB gira · L3 atravessa paredes · Back desfaz · Start sai &nbsp;|&nbsp; ⌨️ WASD anda · Enter põe · F quebra · G leva · C pinta · Q/E material · 1–0 peça · R gira · V atravessa · Esc sai</small>`;
  if(txt!==cons.hudTxt){cons.hudTxt=txt;cons.hud.innerHTML=txt;}
 }
 async function viajar(sd){
  cons.ultSaida=performance.now();cons.chegada={mapa:String(sd.para.mapa),x:sd.para.x,y:sd.para.y};cons.carga=null;
  const nm=mapas().find(x=>String(x.id)===String(sd.para.mapa))?.nome||sd.para.mapa;avisar('🚪 Indo para '+nm+'…');
  try{await ctl()?.openMap?.(String(sd.para.mapa));}catch(e){cons.chegada=null;avisar('⚠️ '+(e?.message||e));}
 }
 function passoConstrutor(t){
  cons.raf=0;if(!cons.ativo)return;
  const dt=Math.min(.05,Math.max(0,(t-(cons.t||t))/1000));cons.t=t;
  const {W,H}=dims(),mid=mapa();
  if(mid&&mid!==cons.mapa){cons.mapa=mid;cons.p=inicioNoMapa();cons.desl=null;cons.carga=null;cons.ultSaida=performance.now();limparPrevia();}
  // andar: alavanca esquerda ou WASD/setas
  let vx=cons.pad.x,vy=cons.pad.y;const T=cons.teclas;
  if(T.size){const kx=(T.has('d')||T.has('arrowright')?1:0)-(T.has('a')||T.has('arrowleft')?1:0),ky=(T.has('s')||T.has('arrowdown')?1:0)-(T.has('w')||T.has('arrowup')?1:0);if(kx||ky){const m=Math.hypot(kx,ky);vx=kx/m;vy=ky/m;}}
  const mag=Math.min(1,Math.hypot(vx,vy));
  if(mag>.05&&mid){
   const vel=4.2*mag,want={x:cons.p.x+vx/Math.max(mag,1e-6)*mag*vel*dt,y:cons.p.y+vy/Math.max(mag,1e-6)*mag*vel*dt};
   let np=want;
   if(!cons.atravessar){
    const objs=objsCena(),mp={larguraM:W,alturaM:H},tok={id:'__construtor',x:cons.p.x*28/W,y:cons.p.y*14/H,diametroM:1,camada:3};
    const ir=q=>{const d=destinoSemColisao(tok,{x:q.x*28/W,y:q.y*14/H},[],mp,objs);return {x:d.x*W/28,y:d.y*H/14};};
    np=ir(want);const prog=q=>Math.hypot(q.x-cons.p.x,q.y-cons.p.y);
    if(prog(np)<prog(want)*.5){const ax=ir({x:want.x,y:cons.p.y}),ay=ir({x:cons.p.x,y:want.y}),m=prog(ax)>=prog(ay)?ax:ay;if(prog(m)>prog(np)+.001)np=m;}
   }
   cons.p={x:Math.max(.45,Math.min(W-.45,np.x)),y:Math.max(.45,Math.min(H-.45,np.y))};cons.facing=Math.atan2(vy,vx);
  }
  const m=miraDe(cons.p,cons.facing,modM,cons.desl);cursor={x:Math.max(0,Math.min(W,m.x)),y:Math.max(0,Math.min(H,m.y))};
  if(t-cons.ultFant>60){cons.ultFant=t;fantasma();desenharHud();}
  desenharAvatar();
  if(mid&&performance.now()-cons.ultSaida>2500){const sd=saidaPerto(cons.ligs,mid,cons.p,W,H,1.5);if(sd)void viajar(sd);}
  cons.raf=win.requestAnimationFrame(passoConstrutor);
 }
 // ------------------------------------------------------------ v196: paleta do construtor (tudo pelo controle de videogame)
 // RT (ou P) abre. Setas / alavanca esquerda: andam pelos itens · LB/RB: trocam de grupo · A: escolhe · B/RT/Start: fecha.
 const pal={aberta:false,aba:0,i:0,t:0,el:null,cols:6};
 function abasPaleta(){
  const objs=(dep.objetos?.()||[]).filter(x=>x&&x.id&&x.imagem),grupos=new Map();
  for(const x of objs){const g=categoriaDeObjeto(x);if(!grupos.has(g))grupos.set(g,[]);grupos.get(g).push({k:'obj',id:String(x.id),nome:x.nome||x.id,img:x.imagem,dica:(Number(x.larguraM)||1)+'×'+(Number(x.alturaM)||1)+' m'});}
  const abas=[
   {nome:'🧱 Estruturas',itens:PECAS.map(p=>({k:'peca',id:p.id,nome:p.nome,icone:p.icone,dica:p.dica}))},
   {nome:'🟫 Pisos e materiais',itens:[...MATERIAIS.map(m=>({k:'pintura',id:m.id,nome:m.nome,cor:m.cor,dica:'material de parede, chão e teto'})),...PISOS.map(p=>({k:'pintura',id:p.id,nome:p.nome,cor:p.cor,img:p.src,dica:'piso (vale para peças de chão)'}))]},
   {nome:'🎨 Cores',itens:CORES_LISAS.map(c=>({k:'pintura',id:c.id,nome:c.nome,cor:c.cor,dica:'cor lisa'}))}
  ];
  for(const [g,itens] of [...grupos].sort((a,b)=>a[0].localeCompare(b[0],'pt')))abas.push({nome:g,itens:itens.sort((a,b)=>String(a.nome).localeCompare(String(b.nome),'pt'))});
  return abas;
 }
 function desenharPaleta(){
  if(!pal.el)return;const abas=pal.abas||(pal.abas=abasPaleta()),a=abas[pal.aba]||abas[0],cols=pal.cols;
  pal.i=Math.max(0,Math.min(a.itens.length-1,pal.i));
  pal.el.innerHTML='<div class="o3p-abas">'+abas.map((x,i)=>'<button type="button" data-pa="'+i+'" aria-pressed="'+(i===pal.aba)+'">'+esc(x.nome)+' <small>'+x.itens.length+'</small></button>').join('')+'</div>'+
   '<div class="o3p-grade" style="grid-template-columns:repeat('+cols+',1fr)">'+a.itens.map((it,i)=>'<button type="button" data-pi="'+i+'" aria-pressed="'+(i===pal.i)+'" title="'+esc(it.nome+(it.dica?' · '+it.dica:''))+'"><span class="o3p-img" style="'+(it.img?"background-image:url('"+esc(it.img)+"')":it.cor?'background:'+esc(it.cor):'')+'">'+(it.img||it.cor?'':esc(it.icone||'•'))+'</span><span class="o3p-n">'+esc(it.nome)+'</span></button>').join('')+'</div>'+
   '<div class="o3p-ajuda">🎮 setas: mover · LB/RB: grupo · A: escolher · B ou RT: fechar</div>';
  const sel=pal.el.querySelector('[data-pi][aria-pressed="true"]');sel?.scrollIntoView?.({block:'nearest'});
 }
 function abrirPaleta(){
  if(!ehMestre()||pal.aberta)return;
  if(!root.getElementById('o3PaletaCss')){const st=root.createElement('style');st.id='o3PaletaCss';st.textContent='#o3Paleta{position:fixed;left:50%;bottom:12px;transform:translateX(-50%);z-index:10000;width:min(980px,96vw);max-height:56vh;display:flex;flex-direction:column;background:rgba(24,16,8,.97);border:1px solid #ffb86b;border-radius:14px;box-shadow:0 14px 40px #000b;color:#ffe2bf;font:13px Segoe UI,Arial,sans-serif;overflow:hidden}#o3Paleta .o3p-abas{display:flex;gap:4px;padding:6px;flex-wrap:wrap;border-bottom:1px solid #4a3216}#o3Paleta button{cursor:pointer;color:#ffe2bf;background:#2a1c0c;border:1px solid #5a4020;border-radius:9px}#o3Paleta .o3p-abas button{padding:5px 9px}#o3Paleta [aria-pressed=true]{border-color:#ffd447;background:#5a3412;box-shadow:0 0 0 2px #ffd44766}#o3Paleta .o3p-grade{display:grid;gap:6px;padding:8px;overflow:auto}#o3Paleta .o3p-grade button{display:flex;flex-direction:column;align-items:center;gap:3px;padding:5px}#o3Paleta .o3p-img{width:100%;aspect-ratio:1;max-width:84px;border-radius:7px;background-size:contain;background-repeat:no-repeat;background-position:center;background-color:#1a120a;display:grid;place-items:center;font-size:26px}#o3Paleta .o3p-n{font-size:11px;text-align:center;line-height:1.15}#o3Paleta .o3p-ajuda{padding:5px 10px;border-top:1px solid #4a3216;color:#d8c2a6;font-size:12px}';root.head.append(st);}
  pal.aberta=true;pal.abas=null;pal.aba=0;pal.i=0;
  pal.el=root.createElement('div');pal.el.id='o3Paleta';pal.el.setAttribute('role','dialog');pal.el.setAttribute('aria-label','Paleta do construtor');
  pal.el.addEventListener('pointerdown',e=>e.stopPropagation());
  pal.el.addEventListener('click',e=>{const a=e.target.closest('[data-pa]'),b=e.target.closest('[data-pi]');if(a){pal.aba=+a.dataset.pa;pal.i=0;desenharPaleta();}else if(b){pal.i=+b.dataset.pi;escolherDaPaleta();}});
  root.body.append(pal.el);desenharPaleta();avisar('📦 Paleta aberta: escolha uma peça, piso, cor ou móvel.');
 }
 function fecharPaleta(){pal.aberta=false;pal.el?.remove();pal.el=null;}
 function paletaMover(dx,dy){
  const abas=pal.abas||(pal.abas=abasPaleta()),a=abas[pal.aba],n=a.itens.length,c=pal.cols;
  if(dx)pal.i=Math.max(0,Math.min(n-1,pal.i+dx));
  if(dy){const j=pal.i+dy*c;if(j>=0&&j<n)pal.i=j;else if(dy>0&&pal.i<n-1)pal.i=n-1;}
  desenharPaleta();
 }
 function escolherDaPaleta(){
  const abas=pal.abas||(pal.abas=abasPaleta()),it=abas[pal.aba]?.itens[pal.i];if(!it)return;
  if(it.k==='peca'){modPeca=it.id;ferramenta='modulo';objSel=null;cons.carga=null;avisar((pecaDe(it.id)?.icone||'')+' '+it.nome+' — '+(it.dica||''));}
  else if(it.k==='pintura'){cons.pintura=it.id;if(MATERIAIS.some(m=>m.id===it.id)){modMat=it.id;lembrar();}if(ferramenta==='colocar'){ferramenta='modulo';objSel=null;}if(!modPeca)modPeca='chao';avisar('🎨 '+it.nome+(it.id.startsWith('piso:')?' — ponha uma peça de Chão para ver o piso.':''));}
  else if(it.k==='obj'){ferramenta='colocar';objSel=it.id;rot=0;cons.carga=null;avisar('🪑 '+it.nome+' — A põe, LB/RB gira.');}
  fecharPaleta();fantasma();desenharHud();desenharPainel(false);
 }
 function paletaControle(k){
  if(k==='CIMA')paletaMover(0,-1);else if(k==='BAIXO')paletaMover(0,1);else if(k==='ESQ')paletaMover(-1,0);else if(k==='DIR')paletaMover(1,0);
  else if(k==='LB'||k==='RB'){const n=(pal.abas||(pal.abas=abasPaleta())).length;pal.aba=(pal.aba+(k==='RB'?1:n-1))%n;pal.i=0;desenharPaleta();}
  else if(k==='A')escolherDaPaleta();
  else if(k==='B'||k==='RT'||k==='START')fecharPaleta();
 }
 function padConstrutor(l){
  cons.pad=pal.aberta?{x:0,y:0,m:0}:(l.mover?.m>0?l.mover:{x:0,y:0,m:0});
  if(pal.aberta&&l.mover?.m>.6){const ag=performance.now();if(ag-pal.t>200){pal.t=ag;paletaMover(Math.abs(l.mover.x)>Math.abs(l.mover.y)?Math.sign(l.mover.x):0,Math.abs(l.mover.x)>Math.abs(l.mover.y)?0:Math.sign(l.mover.y));}}
  if(l.rolar?.m>0){const {W,H}=dims(),base=cons.desl||{x:(cursor?.x??cons.p.x)-cons.p.x,y:(cursor?.y??cons.p.y)-cons.p.y};cons.desl=limitarDesl({x:base.x+l.rolar.x*.12,y:base.y+l.rolar.y*.12});void W;void H;}
  for(const k of l.apertou||[]){
   if(pal.aberta){paletaControle(k,l);continue;}
   if(k==='A')void clique(cursor);else if(k==='RT')abrirPaleta();
   else if(k==='B'){if(cons.carga){cons.carga=null;avisar('✋ Deixou a peça onde estava.');fantasma();}else avisar('Para sair do modo construtor: Start (ou Esc).');}
   else if(k==='X')void quebrar();
   else if(k==='Y'){if(cons.carga)void soltarCarga();else pegar();}
   else if(k==='LT')void pintarAlvo();
   else if(k==='LB'||k==='RB'){if(ferramenta==='colocar'){rot=(rot+(k==='RB'?90:270))%360;}else modGiro=(modGiro+(k==='RB'?1:3))%4;fantasma();desenharPainel(false);}
   else if(k==='ESQ'||k==='DIR')trocarPeca(k==='DIR'?1:-1);
   else if(k==='CIMA'||k==='BAIXO')trocarPintura(k==='BAIXO'?1:-1);
   else if(k==='L3'){cons.atravessar=!cons.atravessar;avisar(cons.atravessar?'👻 Atravessando paredes (L3 de novo: volta a esbarrar).':'🧱 Esbarrando nas paredes de novo.');}
   else if(k==='R3'){cons.desl=null;avisar('🎯 Mira de volta à frente do construtor.');}
   else if(k==='BACK')void voltar();
   else if(k==='START')sairConstrutor();
  }
  return true;
 }
 function entrarConstrutor(){
  if(!ehMestre())return;if(!mapa()){avisar('Abra um mapa primeiro.');return;}
  if(!aberto)alternar(true);aba='modulos';if(!modPeca)modPeca='parede';ferramenta='modulo';objSel=null;
  const bt=root.querySelector('[data-a="editar"]');if(bt&&bt.getAttribute('aria-pressed')==='true')bt.click();
  el('novaSyncBoard')?.classList.add('o3-ativa');
  cons.ativo=true;cons.mapa='';cons.desl=null;cons.carga=null;cons.pintura=cons.pintura||modMat;cons.teclas.clear();cons.t=0;
  try{cons.pararLigs?.();}catch(_){}cons.pararLigs=dep.onSnapshot?dep.onSnapshot(D(LIGACOES),s=>{cons.ligs=s.exists()?(s.data()?.ligacoes||[]):[];},()=>{}):null;
  win.mesaCameraFocoV180_=()=>{if(!cons.ativo)return null;const {W,H}=dims();return {x:cons.p.x/W*100,y:cons.p.y/H*100,W};};
  if(!cons.raf)cons.raf=win.requestAnimationFrame(passoConstrutor);
  desenharPainel(false);avisar('👷 Modo construtor: ande com a alavanca esquerda (ou WASD). A peça aparece à sua frente. Encostou numa 🚪 saída, vai para o outro mapa.');
 }
 function sairConstrutor(){
  cons.ativo=false;if(cons.raf)win.cancelAnimationFrame(cons.raf);cons.raf=0;cons.carga=null;fecharPaleta();cons.teclas.clear();cons.pad={x:0,y:0,m:0};
  try{cons.pararLigs?.();}catch(_){}cons.pararLigs=null;cons.avatar?.remove();cons.avatar=null;cons.hud?.remove();cons.hud=null;
  win.mesaCameraFocoV180_=null;if(ferramenta==='modulo')escolher('');else desenharPainel(false);avisar('👷 Saiu do modo construtor.');
 }
 const TECLAS_ANDAR=new Set(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright']);
 root.addEventListener('keydown',e=>{
  if(!cons.ativo||e.ctrlKey||e.altKey||e.metaKey||/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName||'')||e.target?.isContentEditable)return;
  const k=String(e.key||'').toLowerCase();let usou=true;
  if(pal.aberta){ // teclado na paleta: setas movem, Enter escolhe, Esc/P fecham
   if(k==='arrowleft')paletaMover(-1,0);else if(k==='arrowright')paletaMover(1,0);else if(k==='arrowup')paletaMover(0,-1);else if(k==='arrowdown')paletaMover(0,1);else if(k==='enter')escolherDaPaleta();else if(k==='escape'||k==='p')fecharPaleta();else if(k==='q'||k==='e'){const n=(pal.abas||(pal.abas=abasPaleta())).length;pal.aba=(pal.aba+(k==='e'?1:n-1))%n;pal.i=0;desenharPaleta();}else return;
   e.preventDefault();e.stopImmediatePropagation();return;}
  if(TECLAS_ANDAR.has(k))cons.teclas.add(k);
  else if(k==='escape')sairConstrutor();
  else if(k==='enter'){if(!e.repeat)void clique(cursor);}
  else if(k==='f'){if(!e.repeat)void quebrar();}
  else if(k==='g'){if(!e.repeat){if(cons.carga)void soltarCarga();else pegar();}}
  else if(k==='c'){if(!e.repeat)void pintarAlvo();}
  else if(k==='t'){cons.desl=null;}
  else if(k==='p'){if(!e.repeat)abrirPaleta();}
  else if(k==='v'){if(!e.repeat){cons.atravessar=!cons.atravessar;avisar(cons.atravessar?'👻 Atravessando paredes (V de novo: volta a esbarrar).':'🧱 Esbarrando nas paredes de novo.');}}
  else usou=false;
  if(usou){e.preventDefault();e.stopImmediatePropagation();}
 },true);
 root.addEventListener('keyup',e=>{const k=String(e.key||'').toLowerCase();if(cons.teclas.delete(k)&&cons.ativo)e.preventDefault();},true);
 win.addEventListener('blur',()=>cons.teclas.clear());
 // 🧪 dois mapas vazios ligados por uma saída, para treinar
 const TESTE_A='🧪 Campo de testes A',TESTE_B='🧪 Campo de testes B';
 async function abrirTeste(){
  if(!ehMestre())return;
  try{avisar('🧪 Preparando os mapas de teste…');
   const acha=n=>mapas().find(x=>String(x.nome||'')===n)?.id;
   const a=String(acha(TESTE_A)||await criarMapaBase(TESTE_A,40,30,'grama')),b=String(acha(TESTE_B)||await criarMapaBase(TESTE_B,30,24,'areia'));
   const s=await dep.getDoc(D(LIGACOES)),v=s.exists()?s.data()||{}:{},ligs=v.ligacoes||[];
   if(!ligs.some(l=>[l.a?.mapa,l.b?.mapa].includes(a)&&[l.a?.mapa,l.b?.mapa].includes(b)))
    await dep.setDoc(D(LIGACOES),clean({...v,ligacoes:[...ligs,{id:'lig180_teste',a:{mapa:a,x:27.6,y:7},b:{mapa:b,x:.4,y:7},tipo:'porta',oficina3:true,testeV180:true}],atualizadoEm:Date.now(),ladosV138:v.ladosV138||true}));
   await ctl()?.openMap?.(a);setTimeout(()=>{entrarConstrutor();avisar('🧪 Campo de testes A aberto. A 🚪 saída na beirada direita leva ao Campo B (e volta).');},700);
  }catch(e){avisar('⚠️ '+(e?.message||e));}
 }

 // ------------------------------------------------------------ vigia
 // v177: controle de videogame construindo (o mesa-controle passa a vez enquanto houver peça escolhida)
 globalThis.mesaConstrucaoControleV177_=l=>{
  if(cons.ativo)return padConstrutor(l);
  if(!aberto||ferramenta!=='modulo'||!modPeca||!ehMestre())return false;const {W,H}=dims();if(!cursor)cursor={x:W/2,y:H/2};
  const ag=performance.now();let dx=0,dy=0;const b=l.botoes||{};
  if(b.ESQ)dx=-1;if(b.DIR)dx=1;if(b.CIMA)dy=-1;if(b.BAIXO)dy=1;if(!dx&&!dy&&l.mover?.m>.5){dx=Math.abs(l.mover.x)>.5?Math.sign(l.mover.x):0;dy=Math.abs(l.mover.y)>.5?Math.sign(l.mover.y):0;}
  if((dx||dy)&&ag-ultPad>170){ultPad=ag;cursor={x:Math.max(0,Math.min(W,cursor.x+dx*modM)),y:Math.max(0,Math.min(H,cursor.y+dy*modM))};fantasma();}
  for(const k of l.apertou||[]){
   if(k==='A')void clique(cursor);else if(k==='B')escolher('');else if(k==='RB'||k==='LB'){modGiro=(modGiro+(k==='RB'?1:3))%4;fantasma();desenharPainel(false);}
   else if(k==='X'){const i=MATERIAIS.findIndex(m=>m.id===modMat);modMat=MATERIAIS[(i+1)%MATERIAIS.length].id;fantasma();desenharPainel(false);avisar('Material: '+matDe(modMat).nome);}
   else if(k==='Y'){const i=PECAS.findIndex(p=>p.id===modPeca);modPeca=PECAS[(i+1)%PECAS.length].id;fantasma();desenharPainel(false);avisar(pecaDe(modPeca).icone+' '+pecaDe(modPeca).nome);}}
  return true;
 };
 const vigia=setInterval(()=>{
  try{montarBotao();if(aberto)montarPainel();camadaTracos();
   if(!pararPinceis&&dep.onSnapshot)pararPinceis=dep.onSnapshot(D(DOC_PINCEIS),s=>{custom=(s.exists()?s.data()?.lista||[]:[]).filter(x=>x?.src).map(x=>({...x,custom:true}));if(aberto)desenharPainel(false);},()=>{});
  }catch(e){console.warn('[Oficina 3]',e);}
 },800);
 win.mesaOficina3V175={abrir:()=>alternar(true),fechar:()=>alternar(false),escolher,construtor:{entrar:entrarConstrutor,sair:sairConstrutor,teste:abrirTeste,estado:()=>({ativo:cons.ativo,p:{...cons.p},facing:cons.facing,mira:cursor&&{...cursor},carga:!!cons.carga,pintura:cons.pintura,peca:modPeca,giro:giroEf(),atravessar:cons.atravessar,mapa:cons.mapa}),pad:padConstrutor,teclas:cons.teclas},estado:()=>({aberto,aba,ferramenta,desfazer:desfazer.length}),tracos:()=>tracos,aba:a=>{aba=a;desenharPainel(true);}};
 return {parar(){clearInterval(vigia);try{pararTracos?.();pararPinceis?.();}catch(_){}}};
}
