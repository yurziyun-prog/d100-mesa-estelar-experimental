// Mesa Estelar v200 — Miniaturas 3D animadas (modelos Quaternius, domínio público, renderizados em folhas de quadros por scripts/gerar-sprites-3d.cjs).
//
// O mestre escolhe a "Aparência 3D" de uma miniatura (cartão de comportamento). A miniatura passa a tocar:
//   parado (respira) · andar (de lado, de costas ou de frente, conforme para onde vai) · atacar (para o lado do alvo) · golpe recebido · morrer.
// A arte olha para a ESQUERDA; andando para a direita ela é espelhada. Modelos "cima" (vistos de cima, padrão novo) giram para onde a criatura vai, sem espelhar. A arte antiga continua no lugar de quem não escolheu nada.
// Só desenho: nada é gravado além do campo arte3dV200 do token. Módulo à parte: se falhar, as miniaturas ficam como antes.
import {SPRITES_3D} from './mesa-sprites-3d-dados.js?v=200';
import {ESCALA_FISICA} from './mesa-escala-fisica.js?v=205';

export const BASE_3D='arte/miniaturas3d/';
export const lista3D=()=>Object.entries(SPRITES_3D).map(([id,v])=>({id,nome:v.nome}));
/** ajuste visual: 'h=40;s=120;b=100;z=100;g=0' → {h,s,b,z,g} (matiz em graus, saturação/brilho/tamanho em %, giro em graus) */
export function lerAjuste(txt){const o={h:0,s:100,b:100,z:100,g:0};for(const p of String(txt||'').split(';')){const [k,v]=p.split('=');const n=Number(v);if(k in o&&Number.isFinite(n))o[k]=n;}o.h=Math.max(-180,Math.min(180,o.h));o.s=Math.max(0,Math.min(300,o.s));o.b=Math.max(30,Math.min(200,o.b));o.z=Math.max(40,Math.min(250,o.z));o.g=Math.max(-180,Math.min(180,o.g));return o;}
export const textoAjuste=a=>'h='+Math.round(a.h)+';s='+Math.round(a.s)+';b='+Math.round(a.b)+';z='+Math.round(a.z)+';g='+Math.round(a.g);
/** visual da pessoa (jogador/NPC): 'p=#c68642;r=#2f5fa8;d=#d8b040;c=#b03030;h=curto;k=#2a2018;capa=1'. Sem nada gravado, as cores nascem do id (cada pessoa já aparece diferente). */
export const PALETAS_PESSOA={pele:['#f3d2b3','#e6b98f','#d29a6a','#b27a4c','#8a5a38','#5a3a24'],roupa:['#2b2f36','#6b7078','#17181b','#3a3d44','#4a3a2c','#3b1f27','#2e3b34','#1f2a3a','#8a8f96','#4f4a44'],detalhe:['#b9bcc2','#8a8f96','#a8844a','#c9b27a','#7a2f2a','#6f4a2a','#3b3f46'],capa:['#2a1418','#16181c','#3a1f2a','#1f2a24','#2c2f36','#4a2a2a','#1f2a3a'],calca:['#3a3d44','#4a3a2c','#2b2f36','#1f2a3a','#4f4a44','#3b1f27','#2e3b34'],cabelo:['#1f1a17','#3b2a1e','#6a4426','#b8944f','#8d8d8a','#7a2f1f','#2b2f3a']};
/** cortes de cabelo e desenhos de capa que o jogador/mestre pode escolher (o desenho da capa usa a cor de destaque 'e') */
/** estilos prontos (cores mais realistas, retrofuturista elegante ou dark, militar, medieval): aplicam roupa, detalhes, capa e acessórios de uma vez */
export const ESTILOS_PESSOA=[['soldado','Soldado metálico',{r:'#6b7078',q:'#3a3d44',d:'#aeb3ba',c:'#2e3a32',e:'#aeb3ba',a:'#8a8f96'}],['cromado','Preto cromado',{r:'#17181b',q:'#17181b',d:'#b9bcc2',c:'#111214',e:'#b9bcc2',a:'#3b3f46'}],['elegante','Retrofuturista elegante',{r:'#2a3340',q:'#1f2a3a',d:'#c9b27a',c:'#3a1f2a',e:'#c9b27a',a:'#c9b27a'}],['dark','Retrofuturista dark',{r:'#1d2026',q:'#2c2f36',d:'#7a2f2a',c:'#16181c',e:'#7a2f2a',a:'#2c2f36'}],['viajante','Viajante (couro)',{r:'#4a3a2c',q:'#4f4a44',d:'#8a6a3a',c:'#3a2f26',e:'#8a6a3a',a:'#5a4a3a'}],['nobre','Nobre gótico',{r:'#3b1f27',q:'#1f1418',d:'#a8844a',c:'#1f1418',e:'#a8844a',a:'#a8844a'}]];
export const ORELHAS_PESSOA=[['normal','Normais'],['pontuda','Pontudas'],['grande','Grandes'],['felina','De gato']];
export const ACESSORIOS_PESSOA=[['K','Capacete'],['C','Chapéu'],['O','Coroa'],['F','Faixa'],['H','Chifres'],['S','Ombreiras'],['M','Mochila']];
export const CABELOS_PESSOA=[['curto','Curto'],['longo','Longo'],['rabo','Rabo de cavalo'],['coque','Coque'],['moicano','Moicano'],['volumoso','Volumoso'],['nenhum','Careca']];
export const PADROES_CAPA=[['lisa','Lisa'],['borda','Debrum'],['lista','Faixa no meio'],['ambos','Debrum e faixa'],['emblema','Losango'],['bordaemb','Debrum e losango']];
export const CAMADAS_PESSOA=['capa','cp_borda','cp_lista','cp_emblema','ac_mochila','roupa','calca','detalhe','pele','rosto','ac_ombreiras','orelha_pontuda','orelha_grande','orelha_felina','cabelo_curto','cabelo_longo','cabelo_rabo','cabelo_coque','cabelo_moicano','cabelo_volumoso','ac_chifres','ac_capacete','ac_chapeu','ac_coroa','ac_faixa','ac_espada','ac_pistola','ac_fuzil'];
/** ordem de desenho por vista: de COSTAS a capa e a mochila ficam por cima do corpo (cobrem as costas); nas outras vistas ficam atrás dele */
export const ordemCamadas=vista=>{if(vista!=='costas')return CAMADAS_PESSOA;const atras=['capa','cp_borda','cp_lista','cp_emblema','ac_mochila'],resto=CAMADAS_PESSOA.filter(c=>!atras.includes(c)),i=resto.indexOf('ac_ombreiras');return [...resto.slice(0,i),...atras,...resto.slice(i)];};
const HCODES=CABELOS_PESSOA.map(x=>x[0]),MCODES=PADROES_CAPA.map(x=>x[0]);
const hashId=s=>{let h=2166136261;for(const c of String(s||'')){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
export function lerVisual(txt,id){const h=hashId(id),p=(l,k)=>l[(h>>>k)%l.length];
 const o={p:p(PALETAS_PESSOA.pele,0),r:p(PALETAS_PESSOA.roupa,3),d:p(PALETAS_PESSOA.detalhe,6),c:p(PALETAS_PESSOA.capa,9),h:HCODES[(h>>>12)%HCODES.length],k:p(PALETAS_PESSOA.cabelo,14),capa:0,e:'',m:'ambos',a:'',o:'normal',x:'',z:'',q:p(PALETAS_PESSOA.calca,18)};
 for(const q of String(txt||'').split(';')){const [k,v]=q.split('=');if(!(k in o))continue;if(k==='capa')o.capa=v==='1'?1:0;else if(k==='h')o.h=HCODES.includes(v)?v:o.h;else if(k==='m')o.m=MCODES.includes(v)?v:o.m;else if(k==='o')o.o=ORELHAS_PESSOA.some(x=>x[0]===v)?v:o.o;else if(k==='x')o.x=String(v||'').replace(/[^COFHSMK]/g,'').slice(0,7);else if(k==='z')o.z=String(v||'').replace(/[^A-Z]/g,'').slice(0,8);else if(/^#[0-9a-fA-F]{6}$/.test(v||''))o[k]=v;}
 if(!o.e)o.e=o.d;if(!o.a)o.a=o.d;
 return o;}
export const textoVisual=o=>'p='+o.p+';r='+o.r+';d='+o.d+';c='+o.c+';e='+o.e+';h='+o.h+';k='+o.k+';m='+o.m+';a='+o.a+';o='+o.o+';x='+o.x+(o.z?';z='+o.z:'')+';q='+o.q+';capa='+(o.capa?1:0);
export const corCamadasPessoa=v=>({capa:v.c,cp_borda:v.e,cp_lista:v.e,cp_emblema:v.e,roupa:v.r,calca:v.q,detalhe:v.d,pele:v.p,cabelo_curto:v.k,cabelo_longo:v.k,cabelo_rabo:v.k,cabelo_coque:v.k,cabelo_moicano:v.k,cabelo_volumoso:v.k,orelha_pontuda:v.p,orelha_grande:v.p,orelha_felina:v.p,rosto:'#2a1d16',ac_mochila:v.a,ac_ombreiras:v.a,ac_chifres:v.a,ac_capacete:v.a,ac_chapeu:v.a,ac_coroa:v.a,ac_faixa:v.a,ac_espada:v.z.includes('N')?'#86f3ff':'#c9ced4',ac_pistola:'#3a3f47',ac_fuzil:'#3a3f47'});
/** o golpe depende do que a pessoa empunha (letras do equipamento): espada corta, arma de fogo atira, sem arma é soco */
export const variacaoDeAtaque=(v,acao)=>acao!=='atacar'?acao:(v.z.includes('E')?'atacar_espada':/[PG]/.test(v.z)?'atacar_tiro':acao);
/** quais camadas aparecem para este visual (capa e desenho da capa; só o corte de cabelo escolhido) */
export const camadaVisivel=(v,c)=>{const capa=!!v.capa||v.z.includes('A'),acs=v.x+v.z;if(c==='capa')return capa;if(c.startsWith('cp_'))return capa&&(c==='cp_borda'?/borda|ambos/.test(v.m):c==='cp_lista'?/lista|ambos/.test(v.m):/emblema|emb/.test(v.m));if(c.startsWith('cabelo_'))return c==='cabelo_'+v.h&&!acs.includes('K');if(c.startsWith('orelha_'))return c==='orelha_'+v.o;if(c==='ac_espada'||c==='ac_pistola'||c==='ac_fuzil')return v.z.includes({ac_espada:'E',ac_pistola:'P',ac_fuzil:'G'}[c]);if(c.startsWith('ac_'))return acs.includes({ac_capacete:'K',ac_chapeu:'C',ac_coroa:'O',ac_faixa:'F',ac_chifres:'H',ac_ombreiras:'S',ac_mochila:'M'}[c]);return true;};
export const ehPessoaTokenArte=t=>{let id='';try{id=decodeURIComponent(String(t?.id||''));}catch(_){id=String(t?.id||'');}return !!id&&!/^(synccriatura|dummy|objeto|item|oficina)/.test(id)&&String(t?.catalogType||'')!=='objeto';};
export const existe3D=id=>Object.hasOwn(SPRITES_3D,String(id||''));
// v222: a prévia das três abas do mestre usa corpos 3D de lado para TODAS as pessoas (sem misturar cima/lado).
export const PESSOAS_25D=['m_adventurer','h_adventurer','h_casual_character','m_worker','h_worker','h_punk','m_punk','h_farmer'];
export function pessoa25d(id){let s=String(id||'');try{s=decodeURIComponent(s);}catch(_){}const h=hashId(s);for(let i=0;i<PESSOAS_25D.length;i++){const a=PESSOAS_25D[(h+i)%PESSOAS_25D.length];if(existe3D(a))return a;}return '';}
// A escolha explícita (inclusive voltar à arte original) prevalece sobre o padrão.
export function aparencia3DToken(t){
 if(!t)return '';
 if(globalThis.mesaVista25D&&ehPessoaTokenArte(t)){const a=pessoa25d(t.id);if(a)return a;}
 if(typeof t.arte3dV200==='string')return existe3D(t.arte3dV200)?t.arte3dV200:'';
 // criatura do bestiário sem escolha explícita: já nasce com a miniatura vista de cima dela
 const mc=/^synccriatura:(.+)$/.exec(decodeURIComponent(String(t.id||'')));if(mc){const id='cima_'+mc[1].replace(/~\d+$/,'').normalize('NFD').replace(/[̀-ͯ]/g,'');if(existe3D(id))return id;}
 // v219: pessoa em 2.5D → corpo 3D de lado; vista de cima → boneco de cima
 if(ehPessoaTokenArte(t)&&existe3D('cima_pessoa'))return 'cima_pessoa';
 const combatente=t.spriteIdV199==='npc_combatente'||/(?:^|\/)npc_combatente\.webp(?:[?#].*)?$/.test(String(t.imagem||''));
 return combatente&&existe3D('combatente_bege')?'combatente_bege':'';
}
/** folha de uma ação numa direção; cai na de lado quando a direção não existe (golpe, morrer, parado só têm de lado) */
export function folhaDe(id,acao,dir){const f=SPRITES_3D[id]?.folhas;if(!f)return null;
 if(globalThis.mesaVista25D&&acao==='parado'&&PESSOAS_25D.includes(id))return f.andar_lado||f.parado_lado||null;
 return f[acao+'_'+dir]||f[acao+'_lado']||null;}
/** direção do desenho pelo deslocamento (dx,dy em pixels de tela): lado (espelha se for para a direita), costas (sobe) ou frente (desce) */
export function direcaoPor(dx,dy,atual={dir:'lado',espelha:false}){
 if(Math.abs(dx)<.01&&Math.abs(dy)<.01)return atual;
 if(Math.abs(dy)>Math.abs(dx)*1.25)return {dir:dy<0?'costas':'frente',espelha:false};
 return {dir:'lado',espelha:dx>0};
}
const CSS=`#novaSyncBoard [data-token][data-arte3d]>img{visibility:hidden}
#novaSyncBoard [data-token] .a3d .a3dc{position:absolute;inset:0;isolation:isolate}#novaSyncBoard [data-token] .a3d .a3dc i{position:absolute;inset:0;background-repeat:no-repeat}#novaSyncBoard [data-token] .a3d .a3dc .cor{-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat}#novaSyncBoard [data-token] .a3d .a3dc .som{mix-blend-mode:multiply}
#novaSyncBoard [data-token] .a3d .a3dc[data-energia="1"] .cor{background-color:#efffff!important;filter:drop-shadow(0 0 1px white) drop-shadow(0 0 3px #00cfff)}
#novaSyncBoard [data-token] .a3d .a3dc[data-energia="1"] .som{opacity:0}
#novaSyncBoard [data-token] .a3d{position:absolute;left:-12%;right:-12%;top:-30%;bottom:-2%;background-repeat:no-repeat;pointer-events:none;image-rendering:auto;filter:drop-shadow(0 2px 2px rgba(0,0,0,.55))}`;

/** v205: sem disco/aura atrás da miniatura 3D (o fundo azul do token, a sombra redonda e o anel não existem para quem tem arte 3D) */
const CSS_SEM_AURA=`#novaSyncBoard [data-token] .a3d[data-nado]{animation:a3dNado 1.15s ease-in-out infinite}@keyframes a3dNado{0%,100%{translate:0 1px}50%{translate:0 -2px}}#novaSyncBoard [data-token][data-arte3d]{background:transparent!important;box-shadow:none!important;border-color:transparent!important;filter:none!important}#novaSyncBoard [data-token][data-arte3d]::after,#novaSyncBoard [data-token][data-arte3d]::before{display:none!important}`;

export function instalarArte3d(dep){
 const root=dep.root||document,win=root.defaultView||window;
 /* v205: raio do corpo que bloqueia outros corpos = diâmetro de SOLO da arte de cima / 2 (sem asas, cauda ou arma); null = sem arte medida (a colisão usa o diâmetro do token) */
 win.mesaRaioCorpoV205=t=>{try{const a=aparencia3DToken(t),f=a?ESCALA_FISICA[a]:null;return f&&Number(f.soloM)>0?Number(f.soloM)/2:(a==='cima_pessoa'?.3:null);}catch(_){return null;}};
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 if(!root.getElementById('a3dCss')){const st=root.createElement('style');st.id='a3dCss';st.textContent=CSS+(win.__ARTE_LEGADA_V205?'':CSS_SEM_AURA); /* __ARTE_LEGADA_V205: só para a foto antes dos testes */ root.head.append(st);}
 const previaV=new Map(); // visual da pessoa em teste (antes de salvar)
 const previa=new Map(); // id do token → ajuste em teste (antes de salvar)
 const estado=new Map(); // id do token → {x,y,dir,espelha,acao,desde,fimUnico}
 const preload=new Set();
 const prontos=new Set(); /* v205: folhas já carregadas: trocar de ação (parado↔andar) só troca a folha quando a nova JÁ carregou; antes a camada ficava sem imagem por alguns quadros (a roupa/armadura sumia e voltava) */
 const carrega=u=>{if(preload.has(u))return;preload.add(u);const i=new Image();i.onload=()=>prontos.add(u);i.src=u;};
 function tick(){
  const b=root.getElementById('novaSyncBoard');if(!b)return;const c=ctl();if(!c)return;
  const agora=performance.now(),vivos=new Set();
  // v205: o movimento vem da posição LÓGICA do token (mapa 28x14), nunca do retângulo na tela: pan, zoom e rolagem não fazem ninguém andar nem girar.
  const nodosV203=[...b.querySelectorAll('[data-token]')],bq=b.getBoundingClientRect(),escX=bq.width/28,escY=bq.height/14,pxPorM=(b.offsetWidth||bq.width)/(Number(b.dataset.mapWidth)||28);
  let iV203=-1;
  for(const n of nodosV203){
   iV203++;const id=n.dataset.token,t=(c.tokenVisual||c.token)?.call(c,id),a3=aparencia3DToken(t); /* v205: a prévia do arrasto (posição mostrada), não o último valor salvo: com rede lenta o corpo parecia deslizar sem andar */
   if(!a3){if(n.dataset.arte3d){delete n.dataset.arte3d;n.querySelector(':scope>.a3d')?.remove();estado.delete(id);}continue;}
   vivos.add(id);
   let s=estado.get(id);if(!s||s.a3!==a3){s={x:null,y:null,dir:'lado',espelha:false,acao:'parado',desde:agora,unico:false,a3};estado.set(id,s);}
   n.dataset.arte3d=a3;
   let el=n.querySelector(':scope>.a3d');if(!el){el=root.createElement('div');el.className='a3d';n.append(el);}
   const aj=lerAjuste(previa.has(id)?previa.get(id):t?.arte3dAjusteV203),cima=!!SPRITES_3D[a3].cima,zz=(SPRITES_3D[a3].escala||1)*aj.z/100*((globalThis.mesaVista25D&&PESSOAS_25D.includes(a3))?1.3:1);
   {const fl='drop-shadow(0 2px 2px rgba(0,0,0,.55))'+((aj.h||aj.s!==100||aj.b!==100)?' hue-rotate('+aj.h+'deg) saturate('+aj.s+'%) brightness('+aj.b+'%)':''); // v203: sem filtro de cor quando o ajuste é o padrão (filtros são caros na placa de vídeo)
    if(el.dataset.fl!==fl){el.dataset.fl=fl;el.style.filter=fl;}}
   const fis=win.__ARTE_LEGADA_V205?null:ESCALA_FISICA[a3];
   if(cima&&fis){ // v205: o quadro mede o que mede no mundo (metros do render × ajuste do mestre); não depende do diâmetro do token nem de multiplicadores acumulados
    const px=fis.metros*pxPorM*aj.z/100,tam=px.toFixed(1)+'px';if(el.dataset.fis!==tam){el.dataset.fis=tam;el.style.left=el.style.top='50%';el.style.right=el.style.bottom='auto';el.style.width=el.style.height=tam;el.style.margin=(-px/2).toFixed(1)+'px 0 0 '+(-px/2).toFixed(1)+'px';el.style.transformOrigin='50% 50%';el.style.transform='none';}}
   else if(cima){el.style.left=el.style.right=el.style.top=el.style.bottom='-30%';el.style.transformOrigin='50% 50%';el.style.transform='scale('+zz+')';}
   else{el.style.transformOrigin='50% 100%';el.style.transform='scale('+zz+')';}
   // deslocamento na tela desde o último quadro
   const lx=Number(t?.x)||0,ly=Number(t?.y)||0;let dx=0,dy=0;if(s.x!==null){dx=(lx-s.x)*escX;dy=(ly-s.y)*escY;}s.x=lx;s.y=ly; // posições guardadas em unidades do mapa: mudar o zoom não cria deslocamento
   if(s.ax===undefined){s.ax=lx;s.ay=ly;}
   if(Math.hypot(dx,dy)<=.25&&(!s.ultMov||agora-s.ultMov>350)){s.ax=lx;s.ay=ly;} // parado: a âncora do rumo acompanha (tremor ao redor do ponto não vira giro)
   const mexeu=Math.hypot(dx,dy)>.25,
   // rumo: só muda depois de andar ~7% de uma unidade do mapa (~20 cm num mapa de 80 m) desde a última âncora (filtra tremor de rede e recuo curto); ao parar, guarda o último rumo
   dAnc=Math.hypot(lx-s.ax,ly-s.ay),novoRumo=dAnc>=.07?Math.atan2((ly-s.ay)*escY,(lx-s.ax)*escX):null;if(dAnc>=.07){s.ax=lx;s.ay=ly;}
   const cl=n.classList,morto=!!c.saude?.(id)?.morto;
   let acao=s.acao,dir=s.dir,esp=s.espelha;
   if(mexeu){const d=direcaoPor(dx,dy,{dir,espelha:esp});dir=d.dir;esp=d.espelha;s.ultMov=agora;if(cima&&novoRumo!==null)s.ang=novoRumo;}
   if(morto)acao='morrer';
   else if(cl.contains('ef-golpe')||Number(n.dataset.ataqueIntencaoAte)>agora){ // atacou: vira para o alvo (as variáveis --gdx/--gdy vêm dos efeitos)
    const gx=parseFloat(n.style.getPropertyValue('--gdx')),gy=parseFloat(n.style.getPropertyValue('--gdy'));
    if(Number.isFinite(gx)&&Number.isFinite(gy)){const d=direcaoPor(gx,gy,{dir,espelha:esp});dir=d.dir;esp=d.espelha;if(cima&&(gx||gy))s.ang=Math.atan2(gy,gx);}
    if(s.acao!=='atacar'){s.desde=agora;s.unico=true;}acao='atacar';
   }else if(cl.contains('ef-impacto')){if(s.acao!=='golpe'){s.desde=agora;s.unico=true;}acao='golpe';}
   else if(s.unico&&agora-s.desde<dur(a3,s.acao,dir)){acao=s.acao;} // deixa a ação única terminar
   else {s.unico=false;acao=(mexeu||(s.ultMov&&agora-s.ultMov<350))?'andar':'parado';}
   if(acao!==s.acao){s.desde=agora;if(acao==='morrer')s.unico=true;}
   {const ag=win.mesaAguaVisualV205?.estados?.()?.[id];const nado=ag&&ag.modo==='nadando'&&!ag.aquatico&&acao!=='morrer'?'1':'';if((el.dataset.nado||'')!==nado){if(nado)el.dataset.nado='1';else delete el.dataset.nado;}} // v205: em água funda boia e bate braço/perna (a animação de andar/parado CONTINUA tocando; só ganha o balanço do nado)
   s.poseGraus=undefined; // v203: quem está deitado (cama, cápsula) ou sentado (cadeira, sofá) aparece na pose, virado como o móvel
   {const rp=win.mesaRepouso?.emRepouso?.(id);if(rp&&!morto&&SPRITES_3D[a3].camadas){const ob=(c.cenaAtual?.()?.objects||[]).find(q=>String(q.id)===String(rp.objetoId));acao=rp.tipo==='sentado'?'sentado':'deitado';s.poseGraus=(acao==='sentado'?-90:90)+(Number(ob?.angulo)||0);if(acao!==s.acao)s.desde=agora;}}
   if(cima){dir='lado';esp=false;}
   s.acao=acao;s.dir=dir;s.espelha=esp;
   const f=folhaDe(a3,acao,dir);if(!f)continue;
   const camadas=SPRITES_3D[a3].camadas;
   if(!camadas&&el.dataset.pessoa==='1'){el.dataset.pessoa='';el.innerHTML='';el.dataset.u='';}
   if(camadas){desenharPessoa(el,camadas,acao,t,id,agora-s.desde,s,cima);continue;}
   const url=BASE_3D+f.arquivo;carrega(url);
   if(el.dataset.u!==url){el.dataset.u=url;el.style.backgroundImage='url("'+url+'")';el.style.backgroundSize=(f.quadros*100)+'% 100%';}
   const ciclo=(f.dur||1)*1000,tq=agora-s.desde;
   let i=acao==='andar'||acao==='parado'?Math.floor((tq%ciclo)/ciclo*f.quadros)%f.quadros:Math.min(f.quadros-1,Math.floor(tq/ciclo*f.quadros));
   if(globalThis.mesaVista25D&&acao==='parado'&&PESSOAS_25D.includes(a3))i=0;
   el.style.backgroundPosition=(f.quadros>1?i/(f.quadros-1)*100:0)+'% 0';
   if(cima){let g=((s.ang??Math.PI)*180/Math.PI)-180+aj.g;if(s.rot!==undefined){while(g-s.rot>180)g-=360;while(g-s.rot<-180)g+=360;}s.rot=g;el.style.rotate=g+'deg';el.style.transition='rotate .12s linear';}
   el.style.scale=esp?'-1 1':'1 1';el.dataset.acao=acao;el.dataset.dir=dir;el.dataset.quadro=String(i);
  }
  for(const k of [...estado.keys()])if(!vivos.has(k))estado.delete(k);
 }
 /** pessoa em camadas: cada camada é um cinza com sombra que vira a cor escolhida (cor chapada + a própria folha por cima, em multiplicar) */
 function desenharPessoa(el,camadas,acao,t,id,tq,s,cima){
  const v=lerVisual(previaV.has(id)?previaV.get(id):t?.visualV203,id),cor=corCamadasPessoa(v);
  const mostra=c=>camadaVisivel(v,c);
  const ac=variacaoDeAtaque(v,acao),sufixo=c=>camadas[c][ac+'_lado']||camadas[c][acao+'_lado']||camadas[c].parado_lado;
  const f0=sufixo('roupa'),ciclo=(f0.dur||1)*1000;
  const i=acao==='andar'||acao==='parado'||acao==='deitado'||acao==='sentado'?Math.floor((tq%ciclo)/ciclo*f0.quadros)%f0.quadros:Math.min(f0.quadros-1,Math.floor(tq/ciclo*f0.quadros));
  if(el.dataset.pessoa!=='1'){el.dataset.pessoa='1';el.style.backgroundImage='none';el.innerHTML='';for(const c of CAMADAS_PESSOA){const g=root.createElement('div');g.className='a3dc';g.dataset.c=c;g.innerHTML='<i class="cor"></i><i class="som"></i>';el.append(g);}
   for(const c of CAMADAS_PESSOA)for(const a of ['parado','andar','atacar','golpe','morrer','deitado','sentado']){const ff=camadas[c]?.[a+'_lado'];if(ff)carrega(BASE_3D+ff.arquivo);}} // pré-carrega todas as folhas de todas as ações
  for(const g of el.querySelectorAll('.a3dc')){const c=g.dataset.c;if(!camadas[c]||!mostra(c)){g.style.display='none';continue;}g.style.display='';
   const f=sufixo(c),url='url("'+BASE_3D+f.arquivo+'")',pos=(f.quadros>1?i/(f.quadros-1)*100:0)+'% 0',tam=(f.quadros*100)+'% 100%';
   if(g.dataset.u!==url&&!prontos.has(BASE_3D+f.arquivo)){carrega(BASE_3D+f.arquivo);if(g.dataset.u)continue;} /* mantém a folha anterior até a nova carregar */
   if(g.dataset.u!==url){g.dataset.u=url;carrega(BASE_3D+f.arquivo);for(const k of ['cor','som']){const n=g.querySelector('.'+k);n.style.backgroundSize=tam;if(k==='som')n.style.backgroundImage=url;else{n.style.webkitMaskImage=n.style.maskImage=url;n.style.webkitMaskSize=n.style.maskSize=tam;}}}
   g.dataset.energia=c==='ac_espada'&&v.z.includes('N')?'1':'0';for(const k of ['cor','som']){const n=g.querySelector('.'+k);n.style.backgroundPosition=pos;if(k==='cor'){n.style.webkitMaskPosition=n.style.maskPosition=pos;n.style.backgroundColor=cor[c];}}}
  let g=0;if(cima){g=s.poseGraus!==undefined?s.poseGraus:((s.ang??Math.PI)*180/Math.PI)-180;if(s.rot!==undefined){while(g-s.rot>180)g-=360;while(g-s.rot<-180)g+=360;}s.rot=g;el.style.rotate=g+'deg';el.style.transition='rotate .12s linear';}
  el.dataset.acao=acao;el.dataset.dir='lado';el.dataset.quadro=String(i);
 }
 function dur(a3,acao,dir){const f=folhaDe(a3,acao,dir);return (f?.dur||.8)*1000;}
 const iv=setInterval(()=>{try{tick();}catch(e){console.warn('[Arte 3D]',e);}},80);iv.unref?.();
 const api={previaVisual:(id,txt)=>{if(txt===null||txt===undefined)previaV.delete(id);else previaV.set(id,txt);try{tick();}catch(_){}},previa:(id,txt)=>{if(txt===null||txt===undefined)previa.delete(id);else previa.set(id,txt);try{tick();}catch(_){}},tick,parar:()=>clearInterval(iv),_estado:()=>estado};
 win.mesaArte3dV200=api;return api;
}
