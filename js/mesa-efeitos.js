// Mesa Estelar v128 — Mais animações e sons de batalha, e clima (chuva e tempestade).
//
// Animações (por cima do que já existia para tiros, projéteis e impactos):
//   💥 explosão (granada, bomba, míssil, foguete, explosivos) com onda de choque e tremor do mapa;
//   ⚡ raio elétrico (armas de choque/tesla/arco e raios da tempestade);
//   ⬇️ queda (quem é derrubado ou cai) com poeira; 💀 morte (a miniatura treme, fica cinza e solta fumaça).
// v193: golpe (investida na direção do alvo), impacto, recuo (dano ≥ 8) e esquiva (ataque falhou) nos tokens,
//   e balanço de passos na miniatura de quem se desloca (tudo desliga com prefers-reduced-motion).
// Sons sintetizados no próprio navegador (nada para baixar):
//   tiro de arma de fogo, laser, explosão, trovão, queda, morte; e vozes de criaturas mais assustadoras:
//   rugido (bestas e predadores), estalos de inseto, gemido de morto-vivo, chiado de serpente,
//   borbulho de limo, zumbido de vespa, cacarejo… com grito de dor ao ser ferido e de morte.
// Clima: escolhido no painel 🎨 Visual do mapa (v130: inclui ⛈️ Tempestade e "cenário inteiro"); na tempestade, os raios
// (os raios caem no mesmo instante para todos) e ouvem o trovão logo depois.
// v132: relâmpago (só luz e som) ≠ raio (raro: atinge alguém e causa 2d6 de dano elétrico, ignora armadura;
//   criaturas grandes ou com muito metal atraem mais). Abrigo do mapa (painel 🎨): dentro, vê-se o clarão e ouve-se o
//   trovão, mas raios quase não entram. 🏜️ Tempestade de areia (vento). ☄️ Chuva de meteoros: impactos de 3d6 num raio
//   de ~1,5 m que incendeiam o que é de madeira por perto; nem palácio é 100% seguro. Só o mestre sorteia e grava.
// 🔊 liga/desliga os sons para cada pessoa. Módulo à parte: se falhar, o mapa segue igual.

const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const HEALTH='combatesAtivos/mapaMesaSyncSaude',MAP='combatesAtivos/mapaMesaSyncDireta',HIST='combatesAtivos/mapaMesaSyncHistorico',SCENE='combatesAtivos/mapaMesaSyncDiretaCena';
const clean=v=>JSON.parse(JSON.stringify(v??null));
export const CLIMA='combatesAtivos/mesaClima';

// Tipo de arma para o efeito extra.
export function tipoArma(nome=''){
 const n=sem(nome);
 if(/granad|bomba|explos|missil|missei|foguete|dinamite|lanca.?chamas|morteiro|carga|meteor/.test(n))return 'explosao';
 if(/raio|eletric|choque|tesla|arco voltaico|taser|relampago/.test(n))return 'raio';
 if(/laser|phaser|faser|plasma|blaster|energia/.test(n))return 'laser';
 if(/pistola|revolver|rifle|carabina|espingarda|escopeta|metralhad|fuzil|submetralhad|arma de fogo|bala/.test(n))return 'tiro';
 return '';
}
// v199: som do golpe corpo a corpo pelo nome do ataque (mordida, garra, lâmina ou pancada)
export function tipoCorpo(nome=''){
 const n=sem(nome);
 if(/mordid|presa|dente|ferrao|picad|bico/.test(n))return 'mordida';
 if(/garra|pata|unha|arranh|tentacul|pisot/.test(n))return 'garra';
 if(/espada|faca|lamina|machado|sabre|katana|adaga|lanca|facao|foice|corte|cutelo/.test(n))return 'corte';
 return 'golpe';
}
// Voz da criatura pelo nome/espécie.
export function vozDaCriatura(texto=''){
 const n=sem(texto);
 if(/galinha|\bave\b|passaro|\bpato\b/.test(n))return 'ave';
 if(/vespa|mariposa|enxame|mosca|abelha/.test(n))return 'zumbido';
 if(/insetoid|inseto|carrapato|aranha|escavador|carapaca|rastejador|rastejante/.test(n))return 'inseto';
 if(/zumbi|cadaver|morto|vampir|inchado|parasita/.test(n))return 'gemido';
 if(/serpente|cobra|sanguessuga|lagarto/.test(n))return 'chiado';
 if(/limo|amorf|larva/.test(n))return 'borbulho';
 if(/robo|drone|sentinela|maquina|androide/.test(n))return 'maquina';
 if(/humano|npc|soldado|guarda|mercenari/.test(n))return '';
 return 'rugido';
}
// Raio da tempestade cai neste segundo? (igual para todos: depende só do relógio)
// v132: abrigo (mesmos níveis do painel 🎨): quanto do raio/meteoro passa e quão alto se ouve.
export const ABRIGO_EF=[{raio:1,meteoro:1,som:1,ve:true},{raio:.3,meteoro:.8,som:.8,ve:true},{raio:0,meteoro:.5,som:.55,ve:false},{raio:0,meteoro:.25,som:.45,ve:false},{raio:0,meteoro:.1,som:.35,ve:false}];
export const abrigoEf=n=>ABRIGO_EF[Math.max(0,Math.min(ABRIGO_EF.length-1,Math.round(Number(n)||0)))];
// Muito metal no corpo/nome? (atrai raios)
export const temMetal=texto=>/robo|drone|sentinela|\bmec|metal|armadur|\bur-?\d|androide|chassi|blindad|ciborg|cyborg|tanque|veiculo|ferro|\baco\b|mecha|automato|golem de ferro/.test(sem(texto));
// Peso de cada um no sorteio do raio: tamanho^1,5, ×3 se tiver muito metal.
export function pesoRaio(t,texto=''){const d=Math.max(.3,Number(t?.diametroM)||1);return Math.pow(d,1.5)*(temMetal(texto+' '+(t?.nome||''))?3:1);}
// Sorteio ponderado; "chao" é o peso do raio cair no chão sem atingir ninguém.
export function escolherAtingido(lista,sorte,chao=8){const soma=lista.reduce((a,x)=>a+x.peso,0)+chao;let r=sorte*soma;for(const x of lista){r-=x.peso;if(r<0)return x.t;}return null;}
// Objeto que pega fogo com um meteoro (madeira, tecido, palha, plantas…).
export function inflamavel(o){const n=sem([o?.nome,o?.modeloId,o?.material,o?.tipoVisual].join(' '));if(/metal|\baco\b|ferro|pedra|holo|neon|console|capsula|vidro|cristal|concreto/.test(n))return false;return /madeira|wood|mesa|cadeira|banco|barril|caixote|caixa|estante|prateleira|\bbau|cerca|tronco|feno|palha|inflam|arvore|palmeira|planta|cabana|barraca|tenda|papel|tecido|cortina|sofa|poltrona|estandarte|tapete|\bcama|trono|lenha|banqueta/.test(n);}
export function raioNoSegundo(seg){let h=(seg*2654435761)>>>0;h^=h>>>13;h=Math.imul(h,1274126177)>>>0;return h%7===0;} // v130: ~1 raio a cada 7 s

const ESTILO=`
#efCamada{position:absolute;inset:0;pointer-events:none;z-index:14;overflow:hidden}
#efCamada .ef-exp{position:absolute;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,#fff6c8 0%,#ffcf4a 22%,#ff7a1a 45%,rgba(160,40,10,.6) 62%,rgba(60,30,20,0) 72%);animation:efExp .9s ease-out forwards}
#efCamada .ef-choque{position:absolute;transform:translate(-50%,-50%);border-radius:50%;border:3px solid rgba(255,220,160,.8);animation:efChoque .7s ease-out forwards}
#efCamada .ef-fumaca{position:absolute;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,rgba(70,70,70,.65),rgba(40,40,40,0) 70%);animation:efFumaca 2.6s ease-out forwards}
#efCamada .ef-poeira{position:absolute;transform:translate(-50%,-50%);border-radius:50%;border:2px solid rgba(200,180,140,.7);animation:efPoeira .8s ease-out forwards}
#efCamada .ef-txt{position:absolute;transform:translate(-50%,-50%);font:700 22px 'Segoe UI',Arial,sans-serif;text-shadow:0 2px 6px #000;animation:efSobe 1.6s ease-out forwards}
#efCamada svg.ef-raio{position:absolute;inset:0;width:100%;height:100%;animation:efPisca .45s steps(3) forwards}
#efCamada .ef-flash{position:absolute;inset:0;background:#e8f0ff;animation:efFlash .5s ease-out forwards}
#efCamada .ef-chuva{position:absolute;inset:-20%;background-image:repeating-linear-gradient(105deg,rgba(180,200,230,.0) 0 14px,rgba(180,200,230,.35) 14px 15px,rgba(180,200,230,0) 15px 30px);background-size:60px 60px;animation:efChuva .45s linear infinite;opacity:.8}
#efCamada .ef-escuro{position:absolute;inset:0;background:rgba(10,16,30,.28)}
#novaSyncBoard.ef-tremor{animation:efTremor .45s linear}
#novaSyncBoard [data-token].ef-morre{animation:efMorre 1.4s ease-out forwards}
#novaSyncBoard [data-token].ef-cai{animation:efCai .6s ease-out}
@keyframes efExp{0%{width:10px;height:10px;opacity:1}60%{opacity:1}100%{width:var(--r);height:var(--r);opacity:0}}
@keyframes efChoque{0%{width:10px;height:10px;opacity:1}100%{width:calc(var(--r)*1.8);height:calc(var(--r)*1.8);opacity:0}}
@keyframes efFumaca{0%{width:20px;height:20px;opacity:0}20%{opacity:.9}100%{width:var(--r);height:var(--r);opacity:0;transform:translate(-50%,-90%)}}
@keyframes efPoeira{0%{width:6px;height:3px;opacity:1}100%{width:var(--r);height:calc(var(--r)*.45);opacity:0}}
@keyframes efSobe{0%{opacity:0;transform:translate(-50%,-30%)}15%{opacity:1}100%{opacity:0;transform:translate(-50%,-180%)}}
@keyframes efPisca{0%{opacity:1}33%{opacity:.2}66%{opacity:1}100%{opacity:0}}
@keyframes efFlash{0%{opacity:.75}100%{opacity:0}}
@keyframes efChuva{from{background-position:0 0}to{background-position:-16px 60px}}
@keyframes efTremor{0%,100%{transform:translate(0,0)}20%{transform:translate(-5px,3px)}40%{transform:translate(5px,-3px)}60%{transform:translate(-3px,-2px)}80%{transform:translate(3px,2px)}}
@keyframes efMorre{0%{filter:none}15%{transform:translate(-50%,-50%) translateX(-3px)}30%{transform:translate(-50%,-50%) translateX(3px)}45%{transform:translate(-50%,-50%)}100%{filter:grayscale(1) brightness(.6)}}
@keyframes efCai{0%{}40%{transform:translate(-50%,-50%) scale(.85) rotate(-25deg)}100%{}}
#efSom,#efClima{position:absolute;top:8px;z-index:31;height:28px;border-radius:999px;border:1px solid #3b5878;background:rgba(9,15,29,.85);color:#c6d3e6;font:12px 'Segoe UI',Arial,sans-serif;cursor:pointer;padding:0 9px}
#efSom{right:120px}
#efCamada .ef-meteoro{position:absolute;width:10px;height:10px;border-radius:50%;background:#fff3d0;box-shadow:0 0 14px 6px rgba(255,140,50,.9);transform:translate(-50%,-50%)}
/* v193: golpe, impacto, recuo e esquiva nos tokens (base translate(-50%,-50%) do token) */
#novaSyncBoard [data-token].ef-golpe{animation:efGolpe .38s ease-in}
#novaSyncBoard [data-token].ef-impacto{animation:efImpacto .34s ease-out}
#novaSyncBoard [data-token].ef-recuo{animation:efRecuo .46s cubic-bezier(.2,.7,.3,1)}
#novaSyncBoard [data-token].ef-esquiva{animation:efEsquiva .42s ease-in-out}
#novaSyncBoard [data-token].ef-andando img{animation:efAnda .55s ease-in-out}
@keyframes efGolpe{0%{transform:translate(-50%,-50%)}45%{transform:translate(-50%,-50%) translate(var(--gdx,10px),var(--gdy,0))}100%{transform:translate(-50%,-50%)}}
@keyframes efImpacto{0%{transform:translate(-50%,-50%) scale(1)}30%{transform:translate(-50%,-50%) scale(1.12);filter:brightness(1.7) saturate(1.5)}100%{transform:translate(-50%,-50%) scale(1)}}
@keyframes efRecuo{0%{transform:translate(-50%,-50%)}35%{transform:translate(-50%,-50%) translate(var(--gdx,-14px),var(--gdy,0))}70%{transform:translate(-50%,-50%) translate(calc(var(--gdx,-14px)*.3),calc(var(--gdy,0)*.3))}100%{transform:translate(-50%,-50%)}}
@keyframes efEsquiva{0%{transform:translate(-50%,-50%)}30%{transform:translate(-50%,-50%) translate(var(--gdx,0),var(--gdy,-12px)) rotate(-7deg)}65%{transform:translate(-50%,-50%) translate(calc(var(--gdx,0)*-.35),calc(var(--gdy,-12px)*-.35)) rotate(4deg)}100%{transform:translate(-50%,-50%)}}
@keyframes efAnda{0%,100%{transform:translateY(0) scale(1)}25%{transform:translateY(-5%) scale(1.03,.97)}50%{transform:translateY(0) scale(.98,1.02)}75%{transform:translateY(-5%) scale(1.03,.97)}}
/* v199: miniaturas artísticas (corpo inteiro, fundo transparente): respiram parados, balançam ao andar, investem ao atacar, sacodem ao apanhar, surgem e tombam */
#novaSyncBoard [data-token][data-sprite] img{transform-origin:50% 92%;animation:efRespira var(--resp,3.8s) ease-in-out infinite;animation-delay:var(--resp-d,0s)}
#novaSyncBoard [data-token][data-sprite].ef-andando img{animation:efPassada .56s ease-in-out}
#novaSyncBoard [data-token][data-sprite].ef-golpe img{animation:efInvestida .38s ease-in}
#novaSyncBoard [data-token][data-sprite].ef-impacto img{animation:efSacode .34s ease-out}
#novaSyncBoard [data-token][data-sprite].ef-esquiva img{animation:efDesvia .42s ease-in-out}
#novaSyncBoard [data-token][data-sprite].ef-surge img{animation:efSurge .7s cubic-bezier(.2,1.4,.4,1)}
#novaSyncBoard [data-token][data-sprite].ef-morre img{animation:efTomba 1.4s ease-in forwards}
#novaSyncBoard [data-token][data-sprite].ef-cai img{animation:efTomba .6s ease-out}
@keyframes efRespira{0%,100%{transform:scale(1,1)}50%{transform:scale(1.02,1.05)}}
@keyframes efPassada{0%,100%{transform:translateY(0) rotate(0)}20%{transform:translateY(-6%) rotate(calc(4deg*var(--lado,1)))}50%{transform:translateY(0) rotate(0)}70%{transform:translateY(-6%) rotate(calc(-4deg*var(--lado,1)))}}
@keyframes efInvestida{0%{transform:scale(1) rotate(0)}30%{transform:scale(.92,1.04) rotate(calc(-6deg*var(--lado,1)))}55%{transform:scale(1.16) rotate(calc(8deg*var(--lado,1)))}100%{transform:scale(1) rotate(0)}}
@keyframes efSacode{0%,100%{transform:translateX(0) rotate(0)}20%{transform:translateX(-6%) rotate(-5deg)}45%{transform:translateX(5%) rotate(4deg)}70%{transform:translateX(-3%) rotate(-2deg)}}
@keyframes efDesvia{0%{transform:translateX(0) rotate(0)}35%{transform:translateX(calc(10%*var(--lado,1))) rotate(calc(10deg*var(--lado,1))) scale(.95)}100%{transform:none}}
@keyframes efSurge{0%{transform:scale(.1) translateY(30%);opacity:0;filter:brightness(2.6)}60%{opacity:1;filter:brightness(1.6)}100%{transform:none;opacity:1}}
@keyframes efTomba{0%{transform:none;filter:none}100%{transform:rotate(80deg) translateY(30%) scale(.9);filter:grayscale(1) brightness(.55);opacity:.85}}
/* v200: a miniatura vira para onde anda/ataca (a arte original olha para a esquerda; "e" = espelha), de costas ao subir, ataque com mordida/golpe */
#novaSyncBoard [data-token][data-sprite][data-dir="e"] img{scale:-1 1}
#novaSyncBoard [data-token][data-sprite][data-dir="n"] img{filter:brightness(.8) saturate(.92)}
#novaSyncBoard [data-token][data-sprite][data-dir="n"][data-costas] img{filter:none}
#novaSyncBoard [data-token][data-sprite].ef-golpe img{animation:efInvestida .38s ease-in,efGolpeBrilho .38s ease-in}
@keyframes efGolpeBrilho{0%,100%{filter:none}50%{filter:brightness(1.25) drop-shadow(0 0 4px rgba(255,120,80,.8))}}
/* v200: virar de lado (gira passando por "de perfil") e folhas de andar (quadros de perna/braço, quando existir a arte) */
#novaSyncBoard [data-token][data-sprite].ef-vira img{animation:efVira .26s ease-in-out}
@keyframes efVira{0%{scale:var(--s0,1) 1}50%{scale:0 1}100%{scale:var(--s1,1) 1}}
#novaSyncBoard [data-token][data-folha]{overflow:visible}
#novaSyncBoard [data-token][data-folha] img{opacity:0}
#novaSyncBoard [data-token][data-folha]::after{content:'';position:absolute;inset:0;background:var(--folha) 0 0/calc(var(--quadros)*100%) 100% no-repeat;animation:efFolha .6s steps(var(--passos)) infinite;pointer-events:none}
#novaSyncBoard [data-token][data-folha][data-dir="e"]::after{scale:-1 1}
@keyframes efFolha{to{background-position:100% 0}}
@media (prefers-reduced-motion:reduce){#novaSyncBoard [data-token][data-sprite] img{animation:none!important}}
`;

export function instalarEfeitos(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const D=p=>dep.doc(dep.db,p);
 const el=id=>root.getElementById(id);
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const uid=()=>{try{return String(dep.uid?.()||'');}catch(_){return '';}};
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 if(!el('efCssV128')){const st=root.createElement('style');st.id='efCssV128';st.textContent=ESTILO;root.head.append(st);}
 let somLigado=true;try{somLigado=win.localStorage.getItem('mesa:somEfeitos')!=='0';}catch(_){}
 let ctx=null,mestreVol=null,ultimoEvento='',estados=new Map(),clima={modo:'limpo'},mapa=null,parar=[],assinado=null,ultimoSeg=0,primeira=true;
 // v234: toda troca de mapa interrompe sons já iniciados, inclusive caudas
 // WebAudio longas que sobreviveriam à filtragem de eventos novos.
 let mapaAudioAnterior='',somSilenciadoAte=0;
 function observarTrocaMapa(){
  const atual=mapaAudivel();
  if(atual===mapaAudioAnterior)return;
  mapaAudioAnterior=atual;somSilenciadoAte=Date.now()+450;
  if(ctx){
   const antigo=ctx;ctx=null;mestreVol=null;
   try{void antigo.close().catch(()=>{});}catch(_){}
  }
 }
 const board=()=>el('novaSyncBoard');
 // Sons de combate são eventos espaciais: o documento de saúde é global,
 // mas o áudio só pode tocar no mapa em que o evento realmente ocorreu.
 // Na ausência de um mapa identificável, não tocar (fail closed).
 // A localização mostrada no DOM pode ficar atrasada ao trocar de aba/mapa.
 // Se o controlador e o tabuleiro discordarem, silêncio até sincronizar.
 const mapaAudivel=()=>{
  const atual=String(ctl()?.mapaAtual?.()||''),visivel=String(board()?.dataset.mapaVisivel||'');
  if(atual&&visivel&&atual!==visivel)return '';
  return atual||visivel||'';
 };
 const tokenMapa=id=>{
  if(!id)return '';
  try{return String(ctl()?.token?.(String(id))?.mapaId||'');}catch(_){return '';}
 };
 // v242: verificar não só o ID do evento, mas também a localização
 // atual de seus participantes. O documento global de saúde/combate pode
 // ser atualizado por IA lutando em outros mapas.
 const eventoNoMapa=ev=>{
  const visivel=mapaAudivel(),origem=String(ev?.mapId||ev?.mapaId||'');
  if(!visivel||!origem||origem!==visivel)return false;
  for(const id of [ev?.source?.id,ev?.target?.id]){
   if(!id)continue;
   const local=tokenMapa(id);
   if(local&&local!==origem)return false;
  }
  return true;
 };


 // ------------------------------------------------------------ áudio
 function audio(){
  if(!somLigado)return null;
  try{if(!ctx){ctx=new (win.AudioContext||win.webkitAudioContext)();mestreVol=ctx.createGain();mestreVol.gain.value=.7;mestreVol.connect(ctx.destination);}if(ctx.state==='suspended')ctx.resume();return ctx;}catch(_){return null;}
 }
 root.addEventListener('pointerdown',()=>{if(somLigado)audio();},{once:false,passive:true});
 function tom(f0,f1,dur,vol,onda='sine',atraso=0,{vibrato=0,vibHz=6,distorce=0,filtro=null}={}){
  const c=audio();if(!c)return;const t=c.currentTime+atraso,o=c.createOscillator(),g=c.createGain();
  o.type=onda;o.frequency.setValueAtTime(Math.max(20,f0),t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+Math.min(.04,dur/4));g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  let n=o;
  if(vibrato){const l=c.createOscillator(),lg=c.createGain();l.frequency.value=vibHz;lg.gain.value=vibrato;l.connect(lg);lg.connect(o.frequency);l.start(t);l.stop(t+dur+.05);}
  if(distorce){const w=c.createWaveShaper(),k=distorce,cur=new Float32Array(256);for(let i=0;i<256;i++){const x=i/128-1;cur[i]=(1+k)*x/(1+k*Math.abs(x));}w.curve=cur;n.connect(w);n=w;}
  if(filtro){const f=c.createBiquadFilter();f.type=filtro.tipo||'lowpass';f.frequency.value=filtro.f;f.Q.value=filtro.q||1;n.connect(f);n=f;}
  n.connect(g);g.connect(mestreVol);o.start(t);o.stop(t+dur+.05);
 }
 function ruido(dur,vol,{tipo='lowpass',f=1000,f1=null,q=.8,atraso=0,curva=2}={}){
  const c=audio();if(!c)return;const t=c.currentTime+atraso,b=c.createBuffer(1,Math.ceil(c.sampleRate*dur),c.sampleRate),d=b.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,curva);
  const s=c.createBufferSource(),fl=c.createBiquadFilter(),g=c.createGain();s.buffer=b;fl.type=tipo;fl.frequency.setValueAtTime(f,t);if(f1)fl.frequency.exponentialRampToValueAtTime(f1,t+dur);fl.Q.value=q;g.gain.value=vol;
  s.connect(fl);fl.connect(g);g.connect(mestreVol);s.start(t);
 }
 const SONS={
  tiro(){ruido(.09,.55,{tipo:'highpass',f:900});tom(140,38,.22,.5,'sine');ruido(.45,.12,{f:900,f1:200,atraso:.04});},
  laser(){tom(1900,240,.2,.12,'sawtooth');tom(950,120,.22,.08,'square');},
  explosao(){ruido(1.6,.9,{f:900,f1:60,curva:1.4});tom(70,28,.9,.7,'sine',0,{distorce:20});ruido(.25,.5,{tipo:'highpass',f:1500});},
  trovao(atraso=0,v=1){ruido(.18,.5*v,{tipo:'highpass',f:2000*(v<1?.5:1),atraso});ruido(3.2,.75*v,{f:260*(v<1?.7:1),f1:70,curva:1.1,atraso:atraso+.05});tom(55,32,2.4,.35*v,'sine',atraso+.1);},
  vento(v=1){ruido(4.2,.22*v,{tipo:'bandpass',f:500,f1:900,q:.6,curva:.35});ruido(3.6,.12*v,{tipo:'bandpass',f:1600,f1:1100,q:1.5,curva:.5,atraso:.6});},
  meteoro(){tom(1800,90,1.1,.12,'sawtooth',0,{filtro:{f:2400}});ruido(1.1,.2,{tipo:'bandpass',f:2600,f1:300,q:.8,curva:.3});},
  queda(){tom(95,38,.22,.5,'sine');ruido(.22,.3,{f:500});},
  raio(){ruido(.35,.35,{tipo:'bandpass',f:3200,q:3});tom(2400,800,.3,.06,'square',0,{vibrato:400,vibHz:60});},
  morteHumana(){tom(260,95,.9,.18,'sawtooth',0,{vibrato:12,vibHz:5,filtro:{f:900}});ruido(.4,.1,{f:600,atraso:.5});},
  // v200: GRITO ENSURDECEDOR (ataque sonoro: Eco da Matilha, Besta Ululante…): varredura aguda saturada + rangido + estrondo grave, bem alto
  grito(i=1){
   tom(650*i,2300*i,.5,.62,'sawtooth',0,{vibrato:120,vibHz:9,distorce:70,filtro:{tipo:'bandpass',f:1700,q:.6}});
   tom(2300*i,380*i,1.2,.55,'sawtooth',.48,{vibrato:80,vibHz:12,distorce:55,filtro:{tipo:'bandpass',f:1400,q:.5}});
   tom(1350*i,1250*i,1.5,.2,'square',.1,{vibrato:340,vibHz:38,filtro:{f:3200}});
   tom(56,28,2,.6,'sine',0,{distorce:30});
   ruido(2.1,.55,{tipo:'bandpass',f:2600,f1:520,q:.45,curva:.7});ruido(.3,.7,{tipo:'highpass',f:1800});
  },
  // v200: ROSNADO (zumbis e mortos-vivos): grave rouco com tremor rápido, ar raspando e engasgos
  rosnado(i=1){
   tom(82*i,56*i,1.15,.42,'sawtooth',0,{vibrato:18,vibHz:27,distorce:38,filtro:{f:400,q:1.1}});
   tom(158*i,92*i,.95,.2,'square',.05,{vibrato:24,vibHz:31,filtro:{tipo:'bandpass',f:720,q:1.5}});
   ruido(1,.24,{tipo:'bandpass',f:280,f1:170,q:1.2,curva:.6});
   for(let k=0;k<5;k++)ruido(.07,.22,{tipo:'bandpass',f:460,q:1.4,atraso:.08+k*.15});
  },
  // vozes de criatura: grito (ataque/morte) e dor
  rugido(i=1){tom(115*i,62*i,1.3,.42,'sawtooth',0,{vibrato:9,vibHz:7,distorce:30,filtro:{tipo:'bandpass',f:420,q:1.2}});tom(58*i,40*i,1.2,.3,'square',.02,{distorce:10,filtro:{f:300}});ruido(1.1,.25,{tipo:'bandpass',f:700,q:.7});},
  inseto(i=1){for(let k=0;k<12;k++)tom(2600*i+Math.random()*900,1800*i,.018,.12,'square',k*.045+Math.random()*.02);tom(180*i,140*i,.7,.1,'sawtooth',.1,{vibrato:40,vibHz:38});},
  gemido(i=1){tom(150*i,92*i,1.7,.3,'sawtooth',0,{vibrato:14,vibHz:3.5,filtro:{f:620}});ruido(1.4,.12,{f:500,atraso:.2});},
  chiado(i=1){ruido(1.2*i,.35,{tipo:'highpass',f:3800,curva:.6});},
  borbulho(i=1){for(let k=0;k<7;k++)tom(160*i+Math.random()*180,420*i,.07,.18,'sine',k*.09);},
  zumbido(i=1){tom(210*i,190*i,1.1,.18,'sawtooth',0,{vibrato:30,vibHz:26});},
  ave(i=1){for(let k=0;k<3;k++)tom(950*i,600*i,.07,.16,'square',k*.12);},
  maquina(i=1){tom(220*i,110*i,.6,.12,'square',0,{vibrato:60,vibHz:18});ruido(.4,.15,{tipo:'bandpass',f:2000,q:4});},
  // v199: passos (leve e pesado), golpes corpo a corpo, aparição
  passo(){tom(130,62,.08,.16,'sine');ruido(.06,.1,{f:900,curva:3});},
  passoPesado(){tom(72,34,.2,.4,'sine');ruido(.16,.22,{f:480,curva:2});},
  corte(){ruido(.2,.28,{tipo:'bandpass',f:1800,f1:5200,q:.9,curva:.8});tom(900,300,.12,.05,'sawtooth');},
  golpe(){tom(165,55,.15,.45,'sine');ruido(.1,.28,{f:700,curva:2.5});},
  mordida(){ruido(.05,.3,{tipo:'highpass',f:2400});ruido(.09,.25,{f:800,atraso:.05});tom(115,70,.12,.2,'square',.03);},
  garra(){for(let k=0;k<3;k++)ruido(.07,.22,{tipo:'highpass',f:2800+k*400,atraso:k*.05});},
  surgir(){tom(300,900,.35,.14,'triangle');tom(600,1200,.4,.08,'sine',.05);ruido(.5,.14,{tipo:'bandpass',f:1500,f1:300,q:.6,curva:.6});}
 };
 const tocar=(nome,...a)=>{
  try{
   observarTrocaMapa();
   if(!somLigado||!mapaAudivel()||Date.now()<somSilenciadoAte||!SONS[nome])return;
   SONS[nome](...a);
  }catch(e){console.warn('[Efeitos] som',e);}
 };

 // ------------------------------------------------------------ animações
 function camada(){const b=board();if(!b)return null;let c=el('efCamada');if(!c||c.parentElement!==b){c?.remove();c=root.createElement('div');c.id='efCamada';b.append(c);}return c;}
 const pos=p=>({left:Number(p.x)/28*100+'%',top:Number(p.y)/14*100+'%'});
 function pinta(cls,p,r,tempo,extra=''){const c=camada();if(!c)return;const d=root.createElement('div');d.className=cls;const q=pos(p);d.style.cssText=`left:${q.left};top:${q.top};--r:${r}px;${extra}`;c.append(d);setTimeout(()=>d.remove(),tempo);return d;}
 const ppm=()=>{const b=board();return b?b.clientWidth/(Number(mapa?.larguraM)||28):48;};
 function explosao(p){const m=ppm();pinta('ef-exp',p,m*4.2,1000);pinta('ef-choque',p,m*4.2,800);setTimeout(()=>pinta('ef-fumaca',p,m*4,2700),250);tremor();tocar('explosao');}
 function tremor(){const b=board();if(!b)return;b.classList.remove('ef-tremor');void b.offsetWidth;b.classList.add('ef-tremor');setTimeout(()=>b.classList.remove('ef-tremor'),500);}
 function raio(de,para,{flash=false}={}){
  const c=camada();if(!c)return;const ns='http://www.w3.org/2000/svg',svg=root.createElementNS(ns,'svg');svg.setAttribute('class','ef-raio');svg.setAttribute('viewBox','0 0 280 140');svg.setAttribute('preserveAspectRatio','none');
  const pts=[],n=9;for(let i=0;i<=n;i++){const t=i/n,x=de.x*10+(para.x-de.x)*10*t+(i&&i<n?(Math.random()-.5)*14:0),y=de.y*10+(para.y-de.y)*10*t+(i&&i<n?(Math.random()-.5)*8:0);pts.push(x.toFixed(1)+','+y.toFixed(1));}
  for(const [w,cor] of [[3.2,'rgba(160,190,255,.55)'],[1.2,'#f4f8ff']]){const pl=root.createElementNS(ns,'polyline');pl.setAttribute('points',pts.join(' '));pl.setAttribute('fill','none');pl.setAttribute('stroke',cor);pl.setAttribute('stroke-width',w);pl.setAttribute('stroke-linejoin','round');svg.append(pl);}
  c.append(svg);setTimeout(()=>svg.remove(),500);
  if(flash){const f=root.createElement('div');f.className='ef-flash';c.append(f);setTimeout(()=>f.remove(),520);}
 }
 function clarao(op=.75){const c=camada();if(!c)return;const f=root.createElement('div');f.className='ef-flash';f.style.opacity=String(op);f.style.animationName='none';c.append(f);f.animate?.([{opacity:op},{opacity:0}],{duration:520,easing:'ease-out'});setTimeout(()=>f.remove(),540);}
 function meteoroCaindo(p){
  const c=camada();if(!c)return;tocar('meteoro');const d=root.createElement('div');d.className='ef-meteoro';c.append(d);
  const de={x:Number(p.x)+6,y:-2},q=pos(de),q2=pos(p);d.style.left=q.left;d.style.top=q.top;
  d.animate?.([{left:q.left,top:q.top},{left:q2.left,top:q2.top}],{duration:650,easing:'ease-in',fill:'forwards'});
  setTimeout(()=>{d.remove();explosao(p);},650);
 }
 function texto(p,txt,cor){const d=pinta('ef-txt',p,0,1650,`color:${cor}`);if(d)d.textContent=txt;}
 function marcarToken(id,cls,tempo){const n=board()?.querySelector(`[data-token="${CSS.escape(String(id))}"]`);if(!n)return;n.classList.remove(cls);void n.offsetWidth;n.classList.add(cls);setTimeout(()=>n.classList.remove(cls),tempo);}
 // v193: direção do golpe/recuo em px (eixo X em % da largura, Y em % da altura do quadro)
 const tokenNo=id=>board()?.querySelector(`[data-token="${CSS.escape(String(id))}"]`)||null;
 const movLivre=()=>{try{return !win.matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(_){return true;}};
 function direcaoPX(a,b,mod=16){const el=board();if(!el)return['10px','0'];const px=(Number(b.x)-Number(a.x))*el.clientWidth/28,py=(Number(b.y)-Number(a.y))*el.clientHeight/14,m=Math.hypot(px,py)||1;return[(px/m*mod).toFixed(1)+'px',(py/m*mod).toFixed(1)+'px'];}
 /* v200: direção da miniatura (e=leste, o=oeste, n=costas, s=frente); com arte própria de costas (<id>_costas.webp, listada em mesaVariantesV200) troca a imagem */
 function virar(n,dx,dy){if(!n||!n.dataset.sprite||(!dx&&!dy))return;const d=Math.abs(dx)>=Math.abs(dy)*1.2?(dx>0?'e':'o'):(dy<0?'n':'s');const velho=n.dataset.dir;if(velho===d)return;n.dataset.dir=d;
  if((velho==='e'||velho==='o')&&(d==='e'||d==='o')){n.style.setProperty('--s0',velho==='e'?-1:1);n.style.setProperty('--s1',d==='e'?-1:1);n.classList.remove('ef-vira');void n.offsetWidth;n.classList.add('ef-vira');setTimeout(()=>n.classList.remove('ef-vira'),280);}
  const img=n.querySelector('img');if(!img)return;const V=globalThis.mesaVariantesV200;if(!img.dataset.frente)img.dataset.frente=img.getAttribute('src')||'';const base=img.dataset.frente.replace(/.webp$/,'');if(d==='n'&&V?.has(base.split('/').pop()+'_costas')){img.src=base+'_costas.webp';n.dataset.costas='1';}else if(img.dataset.frente&&img.getAttribute('src')!==img.dataset.frente){img.src=img.dataset.frente;delete n.dataset.costas;}}
 /* folha de andar (arte própria): <id>_andar_lado|costas|frente.webp com N quadros lado a lado; registrada em globalThis.mesaFolhasV200 = {'<id>_andar_lado':{url,quadros}} */
 function folha(n){const F=globalThis.mesaFolhasV200;if(!F||!n.dataset.sprite)return;const img=n.querySelector('img');if(!img)return;const fr=(img.dataset.frente||img.getAttribute('src')||''),base=fr.split('/').pop().replace(/.webp$/,'').replace(/_costas$/,'');
  const d=n.dataset.dir||'o',tipo=d==='n'?'costas':d==='s'?'frente':'lado',f=F[base+'_andar_'+tipo]||F[base+'_andar_lado'];if(!f)return;
  n.style.setProperty('--folha','url('+f.url+')');n.style.setProperty('--quadros',f.quadros);n.style.setProperty('--passos',Math.max(1,f.quadros-1));n.dataset.folha='1';clearTimeout(n._tFolha);n._tFolha=setTimeout(()=>{delete n.dataset.folha;},700);}
 function marcarDir(id,cls,tempo,gdx,gdy){const n=tokenNo(id);if(!n)return;n.classList.remove(cls);void n.offsetWidth;if(gdx!==undefined){n.style.setProperty('--gdx',gdx);n.style.setProperty('--gdy',gdy);n.style.setProperty('--lado',parseFloat(gdx)<0?'-1':'1');}n.classList.add(cls);setTimeout(()=>n.classList.remove(cls),tempo);}
 function nomeToken(id){try{return String(ctl()?.token?.(id)?.nome||'');}catch(_){return '';}}
 function modeloTexto(id){const raw=decodeURIComponent(String(id||''));const mid=raw.replace(/^sync(criatura|npc):/,'').split('~')[0];const m=(dep.criaturas?.()||[]).find(c=>String(c.id)===mid);return [nomeToken(id),m?.nome,m?.especie,m?.tipo].join(' ');}
 const ehCriatura=id=>/^synccriatura:/.test(decodeURIComponent(String(id||'')));
 const ultRosnado=new Map();
 const tamanhoVoz=id=>{const t=ctl()?.token?.(id),d=Number(t?.diametroM)||1;return d>=4?.6:d>=2?.8:d<.6?1.5:1;};

 // ------------------------------------------------------------ reação aos eventos do combate
 function aoEvento(ev){
  if(!ev?.id||ev.id===ultimoEvento)return;ultimoEvento=ev.id;if(Date.now()-Number(ev.ts||0)>6000||!eventoNoMapa(ev))return;
  const nome=String(ev.item?.nome||''),tipo=tipoArma(nome+' '+String(ev.message||'').slice(0,0));
  if(ev.natureza==='clima'&&ev.target){
   const ab=abrigoEf(win.mesaVisualClima?.()?.abrigo);
   if(/meteor/i.test(nome)){meteoroCaindo(ev.target);return;}
   raio({x:ev.target.x+.6,y:-1},ev.target,{flash:true});setTimeout(()=>{if(eventoNoMapa(ev))raio({x:ev.target.x-.4,y:-1},ev.target);},120);tocar('raio');tocar('trovao',.05,Math.max(.6,ab.som));
   if(ev.hit&&ev.target.id){marcarToken(ev.target.id,'ef-cai',650);texto(ev.target,'⚡ '+(Number(ev.damage)||''),'#dfe8ff');}
   return;
  }
  if(ev.source&&ev.target){
   if(tipo==='explosao')setTimeout(()=>{if(eventoNoMapa(ev))explosao(ev.target);},180);
   else if(tipo==='raio'){raio(ev.source,ev.target);tocar('raio');}
   else if(tipo==='tiro')tocar('tiro');
   else if(tipo==='laser'&&!/phaser|faser/i.test(nome))tocar('laser');
   else if(!tipo&&!/psiqu|psychic|grito|trombeta|eco |phaser|faser|sonic|sonor/i.test(sem(nome))){tocar(tipoCorpo(nome));if(ev.hit!==false)setTimeout(()=>{if(eventoNoMapa(ev))tocar('golpe');},90);}
   // v193: golpe no atacante, impacto/recuo ou esquiva no alvo
   if(movLivre()){
    if(ev.source.id){const[gdx,gdy]=direcaoPX(ev.source,ev.target);virar(tokenNo(ev.source.id),parseFloat(gdx),parseFloat(gdy));marcarDir(ev.source.id,'ef-golpe',400,gdx,gdy);}
    if(ev.target.id){
     if(ev.hit!==false){marcarDir(ev.target.id,'ef-impacto',340);const d=Number(ev.damage)||0;if(d>=8){const[rdx,rdy]=direcaoPX(ev.source,ev.target,20);marcarDir(ev.target.id,'ef-recuo',460,rdx,rdy);}}
     else{const[edx,edy]=direcaoPX(ev.source,ev.target,14);marcarDir(ev.target.id,'ef-esquiva',420,edx,edy);}
    }
   }
   // voz da criatura que ataca
   const sid=ev.source.id;if(sid&&ehCriatura(sid)){
    const sonoro=/eco da matilha|ulul|grito|sonor|trombeta|ensurdec/.test(sem(nome)); // ataque sonoro: grito ensurdecedor
    if(sonoro){tocar('grito',tamanhoVoz(sid));if(movLivre())tremor();setTimeout(()=>clarao?.(.35),30);}
    else{let v=vozDaCriatura(modeloTexto(sid));if(v==='gemido')v='rosnado';if(v)tocar(v,tamanhoVoz(sid));} // zumbis rosnam ao atacar
   }
   // dor da criatura atingida
   const tid=ev.target.id;if(tid&&ev.hit!==false&&ehCriatura(tid)){const v=vozDaCriatura(modeloTexto(tid));if(v)setTimeout(()=>{if(eventoNoMapa(ev))tocar(v,tamanhoVoz(tid)*1.35);},260);}
  }
 }
 // mudanças de estado: caiu / morreu
 function aoSaude(hp){
  const atores=hp?.actors||{};
  for(const [id,a] of Object.entries(atores)){
   const cl=a?.combateLab||{},antes=estados.get(id),agora={morto:!!cl.morto,caido:!!(cl.caido||cl.derrubado)};estados.set(id,agora);
   if(primeira||!antes)continue;
   const t=ctl()?.token?.(id);if(!t||!mapaAudivel()||String(t.mapaId||'')!==mapaAudivel())continue;
   if(agora.morto&&!antes.morto){marcarToken(id,'ef-morre',1500);pinta('ef-fumaca',t,ppm()*1.6,2700);texto(t,'💀','#e8e8e8');
    if(ehCriatura(id)){let v=vozDaCriatura(modeloTexto(id));if(v==='rosnado')v='gemido';if(v)tocar(v,tamanhoVoz(id)*.85);}else tocar('morteHumana');setTimeout(()=>{if(String(t.mapaId||'')===mapaAudivel()&&tokenMapa(id)===String(t.mapaId||''))tocar('queda');},500);}
   else if(agora.caido&&!antes.caido){marcarToken(id,'ef-cai',650);pinta('ef-poeira',t,ppm()*1.8,850);tocar('queda');}
  }
  primeira=false;
  aoEvento(hp?.event);
 }

 // ------------------------------------------------------------ clima
let ocupado=false;
 const climaAgora=()=>{try{return win.mesaVisualClima?.()||{clima:'nenhum'};}catch(_){return {clima:'nenhum'};}};
 const dim=()=>({W:Number(mapa?.larguraM)||28,H:Number(mapa?.alturaM)||14});
 const distM=(a,b)=>{const {W,H}=dim();return Math.hypot((Number(a.x)-Number(b.x))*W/28,(Number(a.y)-Number(b.y))*H/14);};
 // só sorteia no mapa que está aberto para todos (o mestre está olhando o mapa ativo)
 const mapaAtivoVisivel=()=>!!mapa?.mapId&&String(board()?.dataset.mapaVisivel||'')===String(mapa.mapId);
 function vivosNoMapa(){
  const c=ctl();let l=[];try{l=c?.tokensNoMapa?.()||[];}catch(_){}
  return l.filter(t=>t&&t.id&&!(c?.saude?.(t.id)?.morto));
 }
 async function gravarClima({alvos,ponto,nome,msg}){
  const hora=Date.now();
  await dep.runTransaction(dep.db,async tx=>{
   const hs=await tx.get(D(HEALTH)),hi=await tx.get(D(HIST));
   const hp=hs.exists()?hs.data():{actors:{}},hh=hi.exists()?hi.data():{entries:[],revision:0};
   const actors={...(hp.actors||{})};for(const {t,r} of alvos)actors[t.id]={...(actors[t.id]||{}),combateLab:r.combateLab};
   const p=alvos[0];
   const event={id:'clima:'+hora.toString(36)+Math.random().toString(36).slice(2,6),ts:hora,mapId:String(mapa?.mapId||''),natureza:'clima',source:{x:Number(ponto.x),y:-1},target:{id:p?String(p.t.id):'',x:Number(ponto.x),y:Number(ponto.y)},item:{nome},hit:!!p,damage:p?Number(p.r.total)||0:0,message:msg};
   tx.set(D(HEALTH),clean({...hp,actors,event,revision:Number(hp.revision||0)+1}));
   tx.set(D(HIST),clean({entries:[...(hh.entries||[]),{id:'clima:'+hora.toString(36),ts:hora,actorUid:'',targetUid:'',message:msg}].slice(-120),revision:Number(hh.revision||0)+1}));
  });
 }
 const limpaNome=n=>String(n||'').replace(/^(NPC|Monstro|PJ|PM|Criatura)\s*[·:-]\s*/i,'').trim();
 const efeitoDano=r=>{const cl=r?.combateLab||{};return cl.morto?' — morto!':cl.inconsciente?' — inconsciente!':cl.caido||cl.derrubado?' — caiu!':'';};
 async function raioAtinge(){
  const api=dep.raio?.();if(ocupado||!api?.atingir||!mapaAtivoVisivel())return;ocupado=true;
  try{
   const lista=vivosNoMapa().map(t=>({t,peso:pesoRaio(t,modeloTexto(t.id))}));
   const t=escolherAtingido(lista,Math.random(),8);if(!t)return;
   const hp=(await dep.getDoc(D(HEALTH))).data?.()||{};
   const r=await api.atingir(t,hp.actors?.[t.id],mapa,{dano:'2d6',nome:'Raio da tempestade'});
   const nome=limpaNome(nomeToken(t.id)||t.nome)||'alguém';
   await gravarClima({alvos:[{t,r}],ponto:t,nome:'Raio da tempestade',msg:`⚡ Um raio da tempestade atinge ${nome}: ${r.total} de dano elétrico (ignora armadura)${efeitoDano(r)}`});
  }catch(e){console.warn('[Efeitos] raio',e);}finally{ocupado=false;}
 }
 async function meteoroCai(){
  const api=dep.raio?.();if(ocupado||!api?.atingir||!mapaAtivoVisivel())return;ocupado=true;
  try{
   const vivos=vivosNoMapa();
   // às vezes cai perto de alguém (para ter perigo de verdade), senão em qualquer lugar
   const perto=vivos.length&&Math.random()<.35?vivos[Math.floor(Math.random()*vivos.length)]:null;
   const ponto=perto?{x:Math.max(.5,Math.min(27.5,Number(perto.x)+(Math.random()-.5)*2.4)),y:Math.max(.5,Math.min(13.5,Number(perto.y)+(Math.random()-.5)*2.4))}:{x:1+Math.random()*26,y:1+Math.random()*12};
   const hp=(await dep.getDoc(D(HEALTH))).data?.()||{},alvos=[];
   for(const t of vivos){const d=distM(t,ponto)-(Number(t.diametroM)||1)/2;if(d>1.5)continue;
    try{alvos.push({t,r:await api.atingir(t,hp.actors?.[t.id],mapa,{dano:'3d6',nome:'Meteoro',fator:d<=.5?1:.5,ignorarArmadura:false})});}catch(e){console.warn('[Efeitos] meteoro',e);}}
   const nomes=alvos.map(({t,r})=>`${limpaNome(nomeToken(t.id)||t.nome)||'alguém'} (${r.total}${efeitoDano(r)})`);
   // fogo nas coisas de madeira em volta (até ~2 m) — usa o fogo que já existe na mesa (queima, espalha, extintor)
   let queimam=[];
   try{await dep.runTransaction(dep.db,async tx=>{const s=await tx.get(D(SCENE)),c=s.exists()?s.data():null;queimam=[];if(!c||String(c.mapId||'')!==String(mapa.mapId))return;
    const objects=(c.objects||[]).map(o=>{if(o.destruido||o.pegandoFogo||!(o.inflamavel===true||inflamavel(o))||distM(o,ponto)>2+Math.max(Number(o.larguraM)||1,Number(o.alturaM)||1)/2)return o;queimam.push(o.nome||'objeto');return {...o,inflamavel:true,inflamabilidade:Math.max(3,Number(o.inflamabilidade)||0),pegandoFogo:true,estadoFogo:{}};});
    if(queimam.length)tx.set(D(SCENE),clean({...c,objects}));});}catch(e){console.warn('[Efeitos] fogo',e);}
   await gravarClima({alvos,ponto,nome:'Meteoro',msg:'☄️ Um meteoro cai no mapa'+(nomes.length?' e atinge '+nomes.join(', '):'')+(queimam.length?' · 🔥 pega fogo: '+[...new Set(queimam)].slice(0,4).join(', '):'')});
  }catch(e){console.warn('[Efeitos] meteoro',e);}finally{ocupado=false;}
 }
 function desenharClima(){
  if(!mapaAtivoVisivel())return;
  // v130: o clima vem do painel 🎨 Visual do mapa (por mapa ou cenário inteiro)
  const e=climaAgora(),modo=e.clima||'nenhum',ab=abrigoEf(e.abrigo),int=Number(e.intensidadeClima)||1;
  const seg=Math.floor(Date.now()/1000);if(seg===ultimoSeg)return;ultimoSeg=seg;
  if(modo==='tempestade'&&raioNoSegundo(seg)){
   // relâmpago: só luz e som (dentro de um abrigo, só o clarão pela janela e o trovão abafado)
   const x=3+((seg*37)%22),y=2+((seg*17)%10);
   if(ab.ve)raio({x:x+((seg%5)-2),y:-1},{x,y},{flash:true});else clarao(.35);
   tocar('trovao',.4+((seg%3)*.5),ab.som);
   // raio de verdade: raro, só o mestre sorteia
   if(ehMestre()&&ab.raio>0&&Math.random()<.08*int*ab.raio)void raioAtinge();
  }
  if(modo==='areia'&&seg%5===0)tocar('vento',ab.som*Math.min(1.5,int));
  if(modo==='meteoros'){
   if(seg%9===0&&!ab.ve)tocar('trovao',0,.25); // estrondo distante
   if(ehMestre()&&Math.random()<int/15&&Math.random()<ab.meteoro)void meteoroCai();
  }
 }
 function botoes(){
  const b=board(),sc=b?.parentElement;if(!sc)return;if(getComputedStyle(sc).position==='static')sc.style.position='relative';
  let s=el('efSom');if(!s){s=root.createElement('button');s.type='button';s.id='efSom';s.title='Sons dos efeitos (só para você)';s.addEventListener('pointerdown',e=>e.stopPropagation());s.addEventListener('click',()=>{somLigado=!somLigado;try{win.localStorage.setItem('mesa:somEfeitos',somLigado?'1':'0');}catch(_){}if(somLigado){audio();tocar('ave');}botoes();});sc.append(s);}
  s.textContent=somLigado?'🔊':'🔇';
  el('efClima')?.remove();
 }

 // ------------------------------------------------------------ assinaturas
 // v193: passos — compara a posição (left/top %) dos tokens a cada ciclo e balança a miniatura quem se moveu
 const ultPos=new Map(),ultPasso=new Map();let ultSomPasso=0,mapaPassos='',passosProntos=false;
 function passos(){
  const b=board();if(!b||!movLivre()||!mapaAudivel())return;
  const mv=String(b.dataset.mapaVisivel||'');if(mv!==mapaPassos){mapaPassos=mv;passosProntos=false;ultPos.clear();ultPasso.clear();}
  const agora=Date.now(),vivos=new Set();
  for(const n of b.querySelectorAll('[data-token]')){
   const id=n.dataset.token;if(!id||tokenMapa(id)!==mapaAudivel())continue;vivos.add(id);
   const ch=(n.style.left||'')+'|'+(n.style.top||''),antes=ultPos.get(id);
   if(n.dataset.sprite&&!n.style.getPropertyValue('--resp-d')){let h=0;for(const c of id)h=(h*31+c.charCodeAt(0))%997;n.style.setProperty('--resp-d',-(h%40)/10+'s');n.style.setProperty('--resp',(3.4+(h%13)/10).toFixed(1)+'s');} /* cada um respira num ritmo */
   if(antes===undefined&&passosProntos&&n.dataset.sprite){n.classList.remove('ef-surge');void n.offsetWidth;n.classList.add('ef-surge');setTimeout(()=>n.classList.remove('ef-surge'),800);tocar('surgir');} /* miniatura nova entrou no mapa */
   if(antes&&antes!==ch&&(ultPasso.get(id)||0)<agora-650){
    const[la,ta]=antes.split('|'),dp=Math.hypot((parseFloat(n.style.left)-parseFloat(la))||0,(parseFloat(n.style.top)-parseFloat(ta))||0);
    if(dp>1){virar(n,parseFloat(n.style.left)-parseFloat(la),parseFloat(n.style.top)-parseFloat(ta));folha(n);ultPasso.set(id,agora);n.style.setProperty('--lado',(parseFloat(n.style.left)-parseFloat(la))<0?'-1':'1');n.classList.remove('ef-andando');void n.offsetWidth;n.classList.add('ef-andando');setTimeout(()=>n.classList.remove('ef-andando'),600);
     if(agora-ultSomPasso>170){ultSomPasso=agora;tocar(ehCriatura(id)&&tamanhoVoz(id)<=.8?'passoPesado':'passo');}
     if(ehCriatura(id)&&Math.random()<.05&&agora-(ultRosnado.get(id)||0)>7000&&vozDaCriatura(modeloTexto(id))==='gemido'){ultRosnado.set(id,agora);tocar('rosnado',tamanhoVoz(id)*.9);} /* zumbi que anda rosna de vez em quando */}
   }
   ultPos.set(id,ch);
  }
  if(ultPos.size>90)for(const k of ultPos.keys())if(!vivos.has(k)){ultPos.delete(k);ultPasso.delete(k);}
  passosProntos=true;
 }
 function assinar(){
  parar.forEach(f=>{try{f();}catch(_){}});parar=[];primeira=true;
  parar.push(dep.onSnapshot(D(HEALTH),s=>{try{aoSaude(s.exists()?s.data():null);}catch(e){console.warn('[Efeitos]',e);}},e=>console.warn('[Efeitos] saúde',e)));
  parar.push(dep.onSnapshot(D(MAP),s=>{mapa=s.exists()?s.data():null;},()=>{}));
 }
 const vigia=setInterval(()=>{try{observarTrocaMapa();if(!uid())return;const k=uid()+'|'+ehMestre();if(assinado!==k){assinado=k;assinar();}botoes();desenharClima();passos();}catch(e){console.warn('[Efeitos]',e);}},250);
 return {tocar,explosao:p=>explosao(p),raio:(a,b)=>raio(a,b,{flash:true}),parar:()=>{clearInterval(vigia);if(ctx){try{void ctx.close().catch(()=>{});}catch(_){}}parar.forEach(f=>{try{f();}catch(_){}});}};
}
