// Mesa Estelar v190 — Montaria e veículos: 🐉 montar, 🚗 dirigir, 🚀 pilotar, com animações de movimento.
//
// • Montaria: perto de um Dragão-Trombeta domesticado (ou outra montaria, cavalgante, pterodátilo…) aparece "🐉 Montar".
//   O montador anda mais rápido (×2); a montaria vai junto debaixo dele, com passada, poeira e sombra enquanto anda.
// • Veículo terrestre (aerocarro, carro, caminhão, carroça…): "🚗 Dirigir". O veículo passa a seguir o motorista,
//   virado para onde ele vai, com poeira e faróis (×3,2 de velocidade).
// • Veículo espacial (naves, caça, disco, transporte…): "🚀 Pilotar". A nave levanta (sombra afastada), balança,
//   acende o propulsor atrás e deixa rastro de velocidade (×4,5).
// • "⬇️ Descer" desfaz. O estado fica na saúde da mesa (actors[id].transporteV190) e todos veem a animação.
// Pedidos de jogadores vão pela fila combatesAtivos/mesaTransporte/acoes; o mestre aplica e move a montaria/o veículo
// junto com quem conduz. Respeita prefers-reduced-motion. Módulo à parte: se falhar, o mapa segue normal.

const clean=v=>JSON.parse(JSON.stringify(v??null));
const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const MAP='combatesAtivos/mapaMesaSyncDireta',POS=MAP+'/posicoes',SCENE='combatesAtivos/mapaMesaSyncDiretaCena',HEALTH='combatesAtivos/mapaMesaSyncSaude',HIST='combatesAtivos/mapaMesaSyncHistorico';
export const PEDIDOS='combatesAtivos/mesaTransporte/acoes';
export const ALCANCE_M=2.4;
export const VELOCIDADE={montaria:2,terrestre:3.2,espacial:4.5,passageiro:1};
export const ICONES={montaria:'🐉',terrestre:'🚗',espacial:'🚀',passageiro:'🧳'};
export const VERBO={montaria:'Montar',terrestre:'Dirigir',espacial:'Pilotar',passageiro:'Embarcar como passageiro em'};
/** v203: quantas pessoas cabem no veículo (além de quem conduz): pela área — moto 1, aerocarro ~4, caminhão ~6, nave grande ~10 */
export const capacidadeDe=o=>Math.max(1,Math.min(10,Math.floor(((Number(o?.larguraM)||1)*(Number(o?.alturaM)||1))/2.4)));
/** Map(id do veículo → nº de passageiros) a partir da saúde da mesa */
export function passageirosPor(actors={}){const m=new Map();for(const a of Object.values(actors||{})){const tr=a?.transporteV190;if(tr?.tipo==='passageiro')m.set(String(tr.alvoId),(m.get(String(tr.alvoId))||0)+1);}return m;}

// ---------------------------------------------------------------- classificação (pura)
const RE_MONTARIA=/montaria|cavalgante|pterodatil|cavalo|dragao.?trombeta.*(domestic|corredor|alado)|domestic.*dragao.?trombeta|trombeta.*domestic/;
// Criatura que serve de montaria: pelo id/nome/espécie do modelo. Selvagem não serve (precisa ser domesticada).
export function ehMontaria(modelo={}){
 const t=sem([modelo.id,modelo.nome,modelo.especie,modelo.comportamento].join(' '));
 if(/selvagem/.test(t)&&!/domestic/.test(t))return false;
 if(/montaria|cavalgante|pterodatil|cavalo/.test(t))return true;
 return /trombeta/.test(t)&&/domestic/.test(t);
}
export function tipoDeVeiculo(o={}){
 const t=sem([o.nome,o.modeloId,o.name].join(' '));
 if(/plataforma|torre|casco|interior|\bpeca\b|telhado|pouso\b/.test(t))return '';
 if(/\bnave\b|cacar?\b|caca estelar|saltador|disco|transporte de passageiros|cargueiro enferrujado|exploradora|interceptador|pk_nave|astronave|shuttle|foguete|bl_cargueiro/.test(t))return 'espacial';
 if(/aerocarro|\bcarro\b|caminhao|carroca|levitador|cargueiro flutuante|veiculo|\bmoto\b|scooter|limusine|sedan|jipe|buggy|pk_vei|pk_carro/.test(t))return 'terrestre';
 return '';
}
/** v203: montaria ALADA (dragão-trombeta alado, pterodátilo…) leva o cavaleiro pelo ar: ele passa por cima de muros, árvores e móveis */
export const montariaVoa=tr=>{if(!tr||tr.tipo!=='montaria')return false;let id=String(tr.alvoId||'');try{id=decodeURIComponent(id);}catch(_){}return /alado|pterodatil|voador|vespa|mariposa/.test(sem(id+' '+(tr.nome||'')));};
export const velocidadeDe=(transporte)=>transporte?.tipo?(montariaVoa(transporte)?2.6:Number(VELOCIDADE[transporte.tipo])||1):1;
// Distância (m) da borda do token ao objeto/outro token.
export function distM(a,b,W=28,H=14){
 const sx=W/28,sy=H/14,dx=(Number(a.x)-Number(b.x))*sx,dy=(Number(a.y)-Number(b.y))*sy;
 const rb=b.larguraM?Math.hypot(Number(b.larguraM)/2,Number(b.alturaM||b.larguraM)/2)*.8:(Number(b.diametroM)||1)/2;
 return Math.max(0,Math.hypot(dx,dy)-rb-(Number(a.diametroM)||1)/2);
}
// Candidatos perto de quem controla: [{tipo,alvoId,nome,dist}] mais perto primeiro.
export function candidatos({ator,tokens=[],objetos=[],modeloDe=()=>null,W=28,H=14,alcance=ALCANCE_M,ocupados=new Set(),passageiros=new Map()}){
 const out=[];
 for(const t of tokens){if(t.id===ator.id||ocupados.has('t:'+t.id))continue;const m=modeloDe(t);if(m&&ehMontaria(m)){const d=distM(ator,t,W,H);if(d<=alcance)out.push({tipo:'montaria',alvoId:t.id,nome:String(t.nome||m.nome||'montaria').replace(/^(Monstro|NPC)\s*[·:-]\s*/i,''),dist:d,diametroM:t.diametroM});}}
 for(const o of objetos){if(!o||o.destruido)continue;const tp=tipoDeVeiculo(o);if(!tp)continue;const d=distM(ator,o,W,H);if(d>alcance+Math.max(0,(Number(o.larguraM)||1)/4))continue;
  if(ocupados.has('o:'+o.id)){if((passageiros.get(String(o.id))||0)<capacidadeDe(o))out.push({tipo:'passageiro',veiculo:tp,alvoId:String(o.id),nome:String(o.nome||'veículo'),dist:d,larguraM:o.larguraM,alturaM:o.alturaM});continue;} // já tem motorista: entra como passageiro
  out.push({tipo:tp,alvoId:String(o.id),nome:String(o.nome||'veículo'),dist:d,larguraM:o.larguraM,alturaM:o.alturaM});}
 return out.sort((a,b)=>a.dist-b.dist);
}
// Quem está ocupando o quê: Set('t:<mount>'|'o:<obj>') a partir da saúde da mesa.
export function ocupadosPor(actors={},exceto=''){
 const s=new Set();for(const [id,a] of Object.entries(actors||{})){const tr=a?.transporteV190;if(tr&&tr.tipo!=='passageiro'&&id!==exceto)s.add((tr.tipo==='montaria'?'t:':'o:')+tr.alvoId);}return s;
}
// Estado novo ao embarcar/desembarcar.
export const embarcar=(c,agora=Date.now())=>({tipo:c.tipo,alvoId:String(c.alvoId),nome:String(c.nome||''),desde:agora,diametroM:c.diametroM,larguraM:c.larguraM,alturaM:c.alturaM});
// Posição do que é conduzido: debaixo de quem conduz; veículo vira para onde o condutor olha (graus; desenho com o nariz para a direita).
export function posicaoConduzida(condutor,transporte){
 const graus=Number.isFinite(Number(condutor.facing))?Math.round(Number(condutor.facing)*180/Math.PI):0;
 return {x:+Number(condutor.x).toFixed(3),y:+Number(condutor.y).toFixed(3),facing:+Number(condutor.facing||0).toFixed(3),angulo:graus};
}
export const moveu=(a,b,limite=.04)=>!!a&&!!b&&Math.hypot(Number(a.x)-Number(b.x),Number(a.y)-Number(b.y))>limite;
// Rastro: o ponto atrás do condutor (em % do mapa) para soltar poeira/propulsão.
export function pontoAtras(t,dist=.8,W=28,H=14){const f=Number(t.facing)||0;return {x:Number(t.x)-Math.cos(f)*dist*28/W,y:Number(t.y)-Math.sin(f)*dist*14/H};}

// ---------------------------------------------------------------- instalação (navegador)
export function instalarTransporte(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const D=p=>dep.doc(dep.db,p);
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const uid=()=>{try{return String(dep.uid?.()||'');}catch(_){return '';}};
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 let seq=0;const novoId=()=>Date.now().toString(36)+(++seq).toString(36);
 let saude=null,cena=null,mapa=null,parar=[],assinado='',botao=null,camada=null,aviso='',processados=new Set(),ocupado=false,ultimoSeguir=0,seguindo=false;
 const ultimaPos=new Map(),ultimoMov=new Map(),poeira=[];
 const dims=()=>({W:Number(mapa?.larguraM)||28,H:Number(mapa?.alturaM)||14});
 const nomeDe=t=>String(t?.nome||'Alguém').replace(/^(NPC|Monstro|PJ|PM)\s*[·:-]\s*/i,'');
 const toast=t=>{aviso=t;desenharBotao(true);setTimeout(()=>{if(aviso===t){aviso='';desenharBotao(true);}},5000);};
 const ESTILO=`#tpBotao{position:absolute;right:8px;top:48px;z-index:38;display:flex;flex-direction:column;gap:4px;align-items:flex-end}
#tpBotao button{height:32px;padding:0 12px;border-radius:999px;border:1px solid #ffd447;background:rgba(10,18,32,.9);color:#ffe9a8;font:600 12px 'Segoe UI',Arial,sans-serif;cursor:pointer}
#tpBotao small{max-width:240px;padding:3px 8px;border-radius:8px;background:rgba(10,18,32,.9);color:#ffe9a8;font:600 11px 'Segoe UI',Arial,sans-serif}
#tpCamada{position:absolute;inset:0;pointer-events:none;z-index:9;overflow:hidden}
#tpCamada .tp{position:absolute;width:0;height:0}
#tpCamada .tp:not(.tp-voa):not(.tp-espacial) .tp-sombra,#tpCamada .tp-anel{display:none} /* v205: sem disco/aura no chão; só a sombra do que voa (efeito aprovado) */
#tpCamada .tp-sombra{position:absolute;left:-26px;top:-12px;width:52px;height:30px;border-radius:50%;background:rgba(0,0,0,.34);filter:blur(3px)}
#tpCamada .tp-bicho{position:absolute;left:-30px;top:-30px;width:60px;height:60px;object-fit:contain;filter:drop-shadow(2px 3px 2px rgba(0,0,0,.5))}
#tpCamada .tp-anel{position:absolute;left:-30px;top:-30px;width:60px;height:60px;border-radius:50%;border:2px solid rgba(255,207,107,.7);box-shadow:0 0 10px rgba(255,207,107,.45)}
#tpCamada .tp-chama{position:absolute;left:-46px;top:-6px;width:34px;height:12px;border-radius:50% 0 0 50%;background:linear-gradient(270deg,#fff3c4,#ff9a3a 45%,rgba(255,80,40,0));transform-origin:right center;animation:tpChama .16s ease-in-out infinite alternate}
#tpCamada .tp-farol{position:absolute;left:10px;top:-22px;width:86px;height:44px;background:conic-gradient(from 270deg at 0 50%,rgba(255,244,200,.38) 0 60deg,transparent 60deg);clip-path:polygon(0 50%,100% 0,100% 100%);opacity:.8}
#tpCamada .tp-vento{position:absolute;left:-70px;top:-14px;width:46px;height:28px;background:repeating-linear-gradient(0deg,transparent 0 6px,rgba(200,230,255,.5) 6px 7px);opacity:.7;animation:tpVento .3s linear infinite}
#tpCamada .tp-puf{position:absolute;width:10px;height:10px;margin:-5px;border-radius:50%;background:rgba(190,170,140,.55);animation:tpPuf .8s ease-out forwards}
#tpCamada .tp.tp-anda .tp-bicho{animation:tpTrote .42s ease-in-out infinite}
#tpCamada .tp.tp-espacial .tp-sombra{left:-18px;top:14px;width:62px;height:34px;opacity:.5}
#tpCamada .tp.tp-voa .tp-sombra{left:-22px;top:18px;width:58px;height:30px;opacity:.4}
#tpCamada .tp.tp-voa .tp-bicho{animation:tpFlutua 1.3s ease-in-out infinite}
#tpCamada .tp.tp-espacial .tp-flut{animation:tpFlutua 1.6s ease-in-out infinite}
.tp-pass{opacity:0!important;pointer-events:none!important}
.tp-condutor{z-index:60!important;filter:drop-shadow(0 3px 3px rgba(0,0,0,.45))}
.tp-condutor.tp-anda{animation:tpBalanco .42s ease-in-out infinite}
@keyframes tpTrote{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-3px) rotate(3deg)}}
@keyframes tpBalanco{0%,100%{translate:0 0}50%{translate:0 -2px}}
@keyframes tpChama{from{transform:scaleX(.7);opacity:.75}to{transform:scaleX(1.15);opacity:1}}
@keyframes tpVento{from{background-position:0 0}to{background-position:-24px 0}}
@keyframes tpFlutua{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes tpPuf{from{transform:scale(.4);opacity:.6}to{transform:scale(2.2);opacity:0}}
@media(prefers-reduced-motion:reduce){#tpCamada *,.tp-condutor{animation:none!important}}`;
 if(!root.getElementById('tpCss')){const st=root.createElement('style');st.id='tpCss';st.textContent=ESTILO;root.head.append(st);}
 function ator(){const c=ctl();try{const t=c?.ator?.();return t&&c.controla?.(t)?t:null;}catch(_){return null;}}
 const modeloDe=t=>{const id=decodeURIComponent(String(t?.id||''));if(!id.startsWith('synccriatura:'))return null;const b=id.slice(13).split('~')[0];return (dep.criaturas?.()||[]).find(c=>String(c.id)===b)||null;};
 win.mesaTransporteVelocidadeV190=id=>velocidadeDe(saude?.actors?.[id]?.transporteV190);
 win.mesaVoandoV203=id=>{const a=saude?.actors;if(!a)return false;let d=String(id||'');try{d=decodeURIComponent(d);}catch(_){}return montariaVoa((a[id]||a[d]||a[encodeURIComponent(d)])?.transporteV190);};

 // ---- pedido (jogador) e aplicação (mestre)
 async function pedir(acao,c){
  const a=ator();if(!a||ocupado)return;ocupado=true;
  try{const cmd={donoUid:uid(),personagemId:decodeURIComponent(String(a.id)),acao,...(c?{tipo:c.tipo,alvoId:c.alvoId,nome:c.nome,diametroM:c.diametroM??null,larguraM:c.larguraM??null,alturaM:c.alturaM??null}:{}),criadoEm:Date.now()};
   if(ehMestre())await aplicar('local'+novoId(),cmd);else{await dep.setDoc(D(PEDIDOS+'/p'+novoId()),clean(cmd));toast('⏳ Pedido enviado…');}}
  catch(e){toast('⚠️ '+String(e?.message||e));}finally{ocupado=false;}
 }
 async function registrar(tx,msg,donoUid=''){const s=await tx.get(D(HIST)),h=s.exists()?s.data():{entries:[],revision:0};tx.set(D(HIST),clean({entries:[...(h.entries||[]),{id:'tp:'+novoId(),ts:Date.now(),actorUid:donoUid,targetUid:'',message:msg}].slice(-120),revision:Number(h.revision||0)+1}));}
 async function aplicar(pid,cmd){
  if(processados.has(pid))return;processados.add(pid);let erro='';
  try{
   const idTok=encodeURIComponent(String(cmd.personagemId||'')),t=ctl()?.token?.(idTok)||(ctl()?.todosTokens?.()||[]).find(x=>x.id===idTok);if(!t)throw Error('Personagem não está no mapa.');
   if(!String(pid).startsWith('local')&&String(t.donoUid||'')!==String(cmd.donoUid||''))throw Error('Pedido de quem não controla o personagem.');
   const {W,H}=dims();
   await dep.runTransaction(dep.db,async tx=>{
    const sh=await tx.get(D(HEALTH)),hp=sh.exists()?sh.data():{actors:{},revision:0},a=hp.actors?.[t.id]||{};
    if(a.combateLab?.morto||a.combateLab?.inconsciente)throw Error('Inconsciente.');
    let msg;let novo;
    if(cmd.acao==='desembarcar'){const tr=a.transporteV190;if(!tr)throw Error('Você não está em nenhum transporte.');novo={...a};delete novo.transporteV190;msg=`⬇️ ${nomeDe(t)} desce de ${tr.nome||'o transporte'}.`;}
    else{
     if(a.transporteV190)throw Error('Desça antes de embarcar em outro.');
     if(!ICONES[cmd.tipo])throw Error('Transporte inválido.');
     if(cmd.tipo==='passageiro'){if(!ocupadosPor(hp.actors).has('o:'+cmd.alvoId))throw Error('Ainda não tem motorista: assuma o volante primeiro.');}
     else if(ocupadosPor(hp.actors).has((cmd.tipo==='montaria'?'t:':'o:')+cmd.alvoId))throw Error('Já está ocupado por outra pessoa.');
     if(cmd.tipo==='montaria'){const m=(ctl()?.todosTokens?.()||[]).find(x=>x.id===cmd.alvoId);if(!m||distM(t,m,W,H)>ALCANCE_M+.5)throw Error('A montaria está longe.');}
     else{const sc=await tx.get(D(SCENE)),o=(sc.exists()?sc.data().objects||[]:[]).find(x=>String(x.id)===String(cmd.alvoId));if(cmd.tipo==='passageiro'&&o&&(passageirosPor(hp.actors).get(String(cmd.alvoId))||0)>=capacidadeDe(o))throw Error('O veículo está lotado.');
      if(!o||(cmd.tipo==='passageiro'?!tipoDeVeiculo(o):tipoDeVeiculo(o)!==cmd.tipo)||distM(t,o,W,H)>ALCANCE_M+Math.max(0,(Number(o.larguraM)||1)/4)+.5)throw Error('O veículo está longe.');}
     novo={...a,transporteV190:embarcar(cmd)};
     msg=cmd.tipo==='passageiro'?`🧳 ${nomeDe(t)} embarca em ${cmd.nome||'o veículo'} como passageiro.`:`${ICONES[cmd.tipo]} ${nomeDe(t)} ${cmd.tipo==='montaria'?'monta':cmd.tipo==='terrestre'?'passa a dirigir':'pilota'} ${cmd.nome||'o transporte'} · velocidade ×${String(VELOCIDADE[cmd.tipo]).replace('.',',')}.`;
    }
    tx.set(D(HEALTH),clean({...hp,actors:{...(hp.actors||{}),[t.id]:novo},revision:Number(hp.revision||0)+1}));
    await registrar(tx,msg,String(t.donoUid||''));
   });
  }catch(e){erro=String(e?.message||e);}
  finally{if(!String(pid).startsWith('local'))try{await dep.deleteDoc?.(D(PEDIDOS+'/'+pid));}catch(_){}}
  if(erro&&String(pid).startsWith('local'))toast('⚠️ '+erro);
  return erro;
 }
 // ---- mestre: a montaria e o veículo andam junto com quem conduz
 async function seguir(){
  if(!ehMestre()||seguindo||Date.now()-ultimoSeguir<500)return;
  const conduzindo=Object.entries(saude?.actors||{}).filter(([,a])=>a?.transporteV190);if(!conduzindo.length)return;
  seguindo=true;ultimoSeguir=Date.now();
  try{
   const toks=ctl()?.todosTokens?.()||[];
   for(const [id,a] of conduzindo){const t=toks.find(x=>x.id===id),tr=a.transporteV190;
    if(tr.tipo==='passageiro')continue; // passageiro é levado pelo motorista (abaixo)
    if(!t||String(t.mapaId||'')!==String(mapa?.mapId||'')){continue;}
    const alvo=posicaoConduzida(t,tr);
    if(tr.tipo==='montaria'){const m=toks.find(x=>x.id===tr.alvoId);if(!m)continue;
     if(Math.hypot(Number(m.x)-alvo.x,Number(m.y)-alvo.y)>.02||Math.abs(Number(m.facing||0)-alvo.facing)>.05)await dep.runTransaction(dep.db,async tx=>{const ref=D(POS+'/'+m.id),s=await tx.get(ref);if(!s.exists())return;tx.set(ref,clean({...s.data(),x:alvo.x,y:alvo.y,facing:alvo.facing,revision:Number(s.data().revision||0)+1}));});}
    else{const o=(cena?.objects||[]).find(x=>String(x.id)===String(tr.alvoId));if(!o)continue;
     if(Math.hypot(Number(o.x)-alvo.x,Number(o.y)-alvo.y)>.02||Math.abs(Number(o.angulo||0)-alvo.angulo)>3)await dep.runTransaction(dep.db,async tx=>{const s=await tx.get(D(SCENE));if(!s.exists())return;const c=s.data();if(String(c.mapId||'')!==String(mapa?.mapId||''))return;tx.set(D(SCENE),clean({...c,objects:(c.objects||[]).map(x=>String(x.id)===String(tr.alvoId)?{...x,x:alvo.x,y:alvo.y,angulo:alvo.angulo}:x)}));});}}
   // v203: passageiros vão junto do motorista, espalhados em volta do centro do veículo
   let idx=0;for(const [id,a] of conduzindo){const tr=a.transporteV190;if(tr.tipo!=='passageiro')continue;
    const drv=conduzindo.find(([,b])=>b.transporteV190.tipo!=='passageiro'&&String(b.transporteV190.alvoId)===String(tr.alvoId)),t=toks.find(x=>x.id===id),dt=drv&&toks.find(x=>x.id===drv[0]);if(!t||!dt)continue;
    const {W,H}=dims(),ang=(idx++)*1.7,al={x:+(Number(dt.x)+Math.cos(ang)*.3*28/W).toFixed(3),y:+(Number(dt.y)+Math.sin(ang)*.3*14/H).toFixed(3)};
    if(Math.hypot(Number(t.x)-al.x,Number(t.y)-al.y)>.02)await dep.runTransaction(dep.db,async tx=>{const ref=D(POS+'/'+id),sn=await tx.get(ref);if(!sn.exists())return;tx.set(ref,clean({...sn.data(),x:al.x,y:al.y,revision:Number(sn.data().revision||0)+1}));});}
  }catch(e){console.warn('[Transporte]',e);}finally{seguindo=false;}
 }
 // ---- interface: botão contextual e animações
 function desenharBotao(forcar=false){
  const b=root.getElementById('novaSyncBoard');if(!b)return;const sc=b.parentElement,t=ator();
  if(!t||decodeURIComponent(String(t.id)).startsWith('sync')){botao?.remove();botao=null;return;}
  const tr=saude?.actors?.[t.id]?.transporteV190,{W,H}=dims();let h='';
  if(tr)h=`<button type="button" data-d>⬇️ Descer de ${esc(tr.nome||'transporte')}</button>`;
  else{const c=candidatos({ator:t,tokens:ctl()?.tokensNoMapa?.()||[],objetos:cena?.objects||[],modeloDe,W,H,ocupados:ocupadosPor(saude?.actors),passageiros:passageirosPor(saude?.actors)});
   h=c.slice(0,2).map((x,i)=>`<button type="button" data-i="${i}" title="${esc(x.nome)} · a ${x.dist.toFixed(1).replace('.',',')} m">${ICONES[x.tipo]} ${VERBO[x.tipo]} ${esc(x.nome)}</button>`).join('');
}
  h+=aviso?`<small>${esc(aviso)}</small>`:'';
  if(!h){botao?.remove();botao=null;return;}
  if(!botao||!botao.isConnected){botao=root.createElement('div');botao.id='tpBotao';botao.addEventListener('pointerdown',e=>e.stopPropagation());
   botao.addEventListener('click',e=>{const bt=e.target.closest('button');if(!bt)return;if(bt.dataset.d!==undefined)void pedir('desembarcar');else{const t2=ator();if(!t2)return;const cs=candidatos({ator:t2,tokens:ctl()?.tokensNoMapa?.()||[],objetos:cena?.objects||[],modeloDe,W:dims().W,H:dims().H,ocupados:ocupadosPor(saude?.actors),passageiros:passageirosPor(saude?.actors)});const c=cs[Number(bt.dataset.i)];if(c)void pedir('embarcar',c);}});
   if(getComputedStyle(sc).position==='static')sc.style.position='relative';sc.append(botao);}
  if(forcar||botao.dataset.h!==h){botao.innerHTML=h;botao.dataset.h=h;}
 }
 function animar(){
  const b=root.getElementById('novaSyncBoard');if(!b)return;
  if(!camada||camada.parentElement!==b){camada?.remove();camada=root.createElement('div');camada.id='tpCamada';b.append(camada);}
  const {W,H}=dims(),agora=Date.now(),toks=ctl()?.tokensNoMapa?.()||[];let h='',vivos=new Set();
  for(const t of toks){const tr=saude?.actors?.[t.id]?.transporteV190;const no=b.querySelector(`[data-token="${CSS.escape(String(t.id))}"]`);
   if(!tr){if(no?.classList.contains('tp-condutor'))no.classList.remove('tp-condutor','tp-anda');if(no?.classList.contains('tp-pass'))no.classList.remove('tp-pass');continue;}
   if(tr.tipo==='passageiro'){vivos.add(t.id);if(no)no.classList.toggle('tp-pass',!/carroca|moto/.test(sem(tr.nome)));continue;} // dentro do veículo fechado a miniatura some; em carroça e moto continua à vista
   vivos.add(t.id);const antes=ultimaPos.get(t.id);if(moveu(antes,t))ultimoMov.set(t.id,agora);ultimaPos.set(t.id,{x:t.x,y:t.y});
   const andando=agora-(ultimoMov.get(t.id)||0)<650,graus=Math.round((Number(t.facing)||0)*180/Math.PI);
   if(no){no.classList.add('tp-condutor');no.classList.toggle('tp-anda',andando&&tr.tipo==='montaria');}
   const pos=`left:${Number(t.x)/28*100}%;top:${Number(t.y)/14*100}%`,mont=tr.tipo==='montaria'?toks.find(x=>x.id===tr.alvoId):null;
   let fx='';
   if(tr.tipo==='montaria'){const img=mont?.imagem?`<img class="tp-bicho" src="${esc(mont.imagem)}" alt="">`:'<div class="tp-anel"></div>';fx=`<div class="tp-sombra"></div><div style="transform:rotate(${graus}deg)">${img}</div>${/trombeta/.test(sem(tr.nome+(mont?.nome||'')))?'<div class="tp-anel"></div>':''}`;}
   else if(tr.tipo==='terrestre')fx=`<div style="transform:rotate(${graus}deg)"><div class="tp-farol"></div></div><div class="tp-sombra"></div>`;
   else fx=`<div class="tp-sombra"></div><div class="tp-flut" style="transform:rotate(${graus}deg)">${andando?'<div class="tp-vento"></div>':''}<div class="tp-chama" style="${andando?'':'opacity:.55;'}"></div></div>`;
   h+=`<div class="tp tp-${tr.tipo}${montariaVoa(tr)?' tp-voa':''}${andando?' tp-anda':''}" style="${pos}">${fx}</div>`;
   // poeira atrás (montaria e veículo terrestre andando)
   if(andando&&tr.tipo!=='espacial'&&agora-(poeira.at(-1)?.t||0)>260){const p=pontoAtras(t,.7,W,H);poeira.push({t:agora,x:p.x,y:p.y});}
  }
  while(poeira.length&&agora-poeira[0].t>800)poeira.shift();
  for(const p of poeira)h+=`<div class="tp" style="left:${p.x/28*100}%;top:${p.y/14*100}%"><div class="tp-puf"></div></div>`;
  if(camada.dataset.h!==h){camada.innerHTML=h;camada.dataset.h=h;}
  // limpa a classe de quem desceu
  for(const n of b.querySelectorAll('.tp-condutor,.tp-pass')){if(!vivos.has(n.dataset.token))n.classList.remove('tp-condutor','tp-anda','tp-pass');}
 }
 function assinar(){
  parar.forEach(f=>{try{f();}catch(_){}});parar=[];
  parar.push(dep.onSnapshot(D(HEALTH),s=>{saude=s.exists()?s.data():null;},()=>{}));
  parar.push(dep.onSnapshot(D(MAP),s=>{mapa=s.exists()?s.data():null;},()=>{}));
  parar.push(dep.onSnapshot(D(SCENE),s=>{cena=s.exists()?s.data():null;},()=>{}));
  if(ehMestre())parar.push(dep.onSnapshot(dep.collection(dep.db,...PEDIDOS.split('/')),q=>{q.forEach(d=>{void aplicar(d.id,d.data()||{});});},()=>{}));
 }
 const vigia=setInterval(()=>{try{const k=uid()+'|'+ehMestre();if(!uid())return;if(k!==assinado){assinado=k;assinar();}desenharBotao();animar();void seguir();}catch(e){console.warn('[Transporte]',e);}},300);
 const api={pedir,aplicar,velocidade:win.mesaTransporteVelocidadeV190,estado:id=>saude?.actors?.[id]?.transporteV190||null};win.mesaTransporte=api;
 return {...api,parar(){clearInterval(vigia);parar.forEach(f=>{try{f();}catch(_){}});botao?.remove();camada?.remove();root.querySelectorAll('.tp-condutor').forEach(n=>n.classList.remove('tp-condutor','tp-anda'));if(win.mesaTransporte===api)delete win.mesaTransporte;delete win.mesaTransporteVelocidadeV190;delete win.mesaVoandoV203;}};
}
