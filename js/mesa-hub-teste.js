// Mesa Estelar v205 — 🌿 Mapa de teste: UM painel que reúne tudo (antes eram 5 botões soltos que confundiam: criar, reformar, testar com personagem, aba de jogador, ajustar tamanhos).
// Só organiza e explica: cada botão chama a ferramenta que já existia (mesaReformaTeste, mesaTestePersonagem, mesaApagarMapasV173, criarEcossistema). Nada novo é gravado aqui,
// a não ser o "guardar" (esconder do seletor, sem apagar) de um mapa de teste duplicado.
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export const ehMapaDeTeste=m=>/ecossistema/i.test(String(m?.nome||'')+' '+String(m?.id||''));
/** o mapa de teste "principal": o aberto agora, senão o de reforma mais nova, senão o primeiro visível */
export function escolherPrincipal(lista,abertoId=''){
 const v=lista.filter(m=>!m.arquivadoV176);const base=v.length?v:lista;
 return base.find(m=>String(m.id)===String(abertoId))||[...base].sort((a,b)=>(Number(b.versao)||0)-(Number(a.versao)||0))[0]||null;
}
export function instalarHubTeste(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 const lista=()=>(dep.mapas?.()||[]).filter(ehMapaDeTeste).map(m=>({id:String(m.id),nome:String(m.nome||m.id),versao:m.reformaTesteV2?.versao||0,w:m.larguraM,h:m.alturaM,arquivadoV176:!!m.arquivadoV176}));
 const aberto=()=>{try{return String(ctl()?.mapaAtual?.()||'');}catch(_){return '';}};
 let msg='';
 const CSS=`#hubTeste{position:fixed;inset:0;z-index:10060;background:rgba(3,7,16,.72);display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:4vh 12px}
#hubTeste>div{width:min(640px,100%);background:#101a2c;color:#e8eefc;border:1px solid #8ee7ff;border-radius:14px;padding:16px 18px;font:14px/1.45 'Segoe UI',Arial,sans-serif;box-shadow:0 18px 50px rgba(0,0,0,.6)}
#hubTeste h3{margin:0 0 4px;font-size:18px;display:flex;align-items:center;gap:8px}#hubTeste h3 span{flex:1}#hubTeste h4{margin:14px 0 6px;font-size:13px;color:#8ee7ff;text-transform:uppercase;letter-spacing:.04em}
#hubTeste p{margin:4px 0;color:#b8c8de;font-size:13px}#hubTeste small{color:#8aa0bb;font-size:12px}
#hubTeste button{padding:8px 12px;border-radius:9px;border:1px solid #3e5a8f;background:#16253f;color:#fff;font:600 13px 'Segoe UI',Arial,sans-serif;cursor:pointer}#hubTeste button:hover:not(:disabled){background:#1f3355}#hubTeste button:disabled{opacity:.45;cursor:not-allowed}
#hubTeste button.pri{background:#2d6cdf;border-color:#2d6cdf}
#hubTeste .ht-mapa{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;padding:8px 10px;margin:6px 0;border:1px solid #2a4468;border-radius:10px;background:#0c1424}#hubTeste .ht-mapa.princ{border-color:#57e3a1}
#hubTeste .ht-bt{display:flex;gap:6px;flex-wrap:wrap}#hubTeste .ht-tag{display:inline-block;margin-left:6px;padding:1px 7px;border-radius:999px;background:#1d3a2c;color:#aef0cd;font-size:11px;font-weight:600}
#hubTeste .ht-grade{display:grid;grid-template-columns:1fr 1fr;gap:8px}@media(max-width:520px){#hubTeste .ht-grade{grid-template-columns:1fr}}#hubTeste .ht-grade button{text-align:left;height:100%}#hubTeste .ht-grade button small{display:block;font-weight:400;margin-top:2px}
#hubTeste .ht-msg{margin-top:10px;min-height:20px;color:#cfe;font-size:13px}`;
 function fechar(){root.getElementById('hubTeste')?.remove();}
 function toast(t){let e=root.getElementById('htToast');if(!e){e=root.createElement('div');e.id='htToast';e.style.cssText='position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:10070;max-width:min(560px,92vw);padding:10px 14px;border-radius:12px;background:#101a2c;color:#e8eefc;border:1px solid #8ee7ff;font:13px Segoe UI,Arial,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.5)';root.body.append(e);}e.textContent=t;clearTimeout(e._t);e._t=setTimeout(()=>e.remove(),6000);}
 function avisar(t){msg=t;const e=root.getElementById('htMsg');if(e)e.textContent=t;}
 async function abrirMapa(id){try{await ctl()?.openMap?.(String(id));avisar('✔ Abri o mapa. Se ele ainda estiver carregando, espere alguns segundos.');}catch(e){avisar('⚠️ '+(e?.message||e));}desenhar();}
 async function guardar(id){try{await dep.setDoc(dep.doc(dep.db,'mapas',String(id)),{arquivadoV176:true},{merge:true});const m=(dep.mapas?.()||[]).find(x=>String(x.id)===String(id));if(m)m.arquivadoV176=true;try{win.labAtualizarSelectMapas_?.();}catch(_){}avisar('🗄️ Guardei a cópia (ela some do seletor, mas não foi apagada; dá para mostrar de novo em 🗂️ Mapas).');}catch(e){avisar('⚠️ '+(e?.message||e));}desenhar();}
 function atualizar(id){
  if(!win.mesaReformaTeste?.abrirPainel){avisar('A ferramenta de atualizar ainda não carregou. Tente de novo em alguns segundos.');return;}
  fechar();win.mesaReformaTeste.abrirPainel();setTimeout(()=>{const s=root.querySelector('#rfPainel [data-mapa]');if(s)s.value=String(id);},50);
 }
 function criarNovo(){
  fechar();import('./mesa-ecossistema.js?v=205').then(m=>m.criarEcossistema({root,win,dep:{db:dep.db,doc:dep.doc,getDoc:dep.getDoc,setDoc:dep.setDoc,criaturas:()=>dep.criaturas?.()||[],npcs:()=>dep.npcs?.()||[],uid:()=>dep.uid?.()},avisar:toast})).catch(e=>{console.warn('[Ecossistema]',e);toast('Não deu certo: '+(e?.message||e));});
 }
 /** v205: mapa BÁSICO para validar o caminho inteiro (criar → desenhar → SALVAR no banco real → personagem de teste): uma casa de 2 cômodos, portas, janelas, mesa, cama, tapete e lampiões. Mostra o resultado estruturado do salvar (ou o erro original do Firebase). */
 async function criarBasico(){
  const E=win.mesaEditorRapidoV197;if(!E?.construir||!E.criarMapa){avisar('O Editor rápido ainda não carregou. Tente de novo em alguns segundos.');return;}
  const NOME='🏠 Casa de teste (básico)',existente=(dep.mapas?.()||[]).find(m=>String(m.nome||'')===NOME&&!m.arquivadoV176);
  if(!win.confirm(existente?'O mapa "'+NOME+'" já existe. Vou RECONSTRUIR ele (casa, jardim, Kael e criatura); o que você mexeu nele sai. Continuar?':'Criar o mapa "'+NOME+'" (24 × 16 m)? É um mapa novo; nada do que existe é alterado.'))return;
  const log=[];const diz=t=>{log.push(t);avisar(log.slice(-6).join(' · '));console.info('[Mapa básico]',t);};
  try{
   const sel=root.getElementById('novaSyncPersonagem');if(sel&&sel.value!=='__mestre__'&&[...sel.options].some(o=>o.value==='__mestre__')){sel.value='__mestre__';sel.dispatchEvent(new win.Event('change',{bubbles:true}));}
   let id;
   if(existente){
    id=String(existente.id);diz('⏳ Abrindo o mapa que já existe para reconstruir…');
    try{await ctl()?.openMap?.(id);}catch(_){}
    for(let i=0;i<100&&!E.pronto(id);i++)await new Promise(r=>setTimeout(r,100));
    if(!E.pronto(id))throw Error('Não consegui abrir "'+NOME+'" para edição. Abra-o em 🗂️ Mapas e clique de novo.');
    const R0=win.mesaRascunhoMapaV193;try{R0.descartar?.();}catch(_){}
    const velhos=E.objetos().map(o=>({kind:'remove',id:o.id}));if(velhos.length){R0.empurrar(velhos);for(let k=0;k<60&&E.objetos().length;k++)await new Promise(r=>setTimeout(r,150));}
    // criaturas e personagem de testes antigos deste mapa saem (para não duplicar)
    try{for(const t of (ctl()?.todosTokens?.()||[]))if(String(t.mapaId||'')===id&&/^synccriatura:/.test(decodeURIComponent(String(t.id||''))))await dep.deleteDoc?.(dep.doc(dep.db,'combatesAtivos','mapaMesaSyncDireta','posicoes',String(t.id)));}catch(_){}
   }else{
    diz('⏳ Criando o mapa…');id=await E.criarMapa(NOME,24,16,'terra');
   }
   for(let i=0;i<80&&!E.pronto(id);i++)await new Promise(r=>setTimeout(r,100));if(!E.pronto(id))throw Error('O mapa novo foi criado mas não abriu para edição. Abra-o em 🗂️ Mapas e clique de novo.');
   const X=6,Y=4,Wc=12,Hc=8;
   E.construir([{t:'cfg',texParede:'tijolo',texPiso:'madeira',esp:.3},{t:'ops',ops:[['piso',[0,0,24,16],{piso:'grama_curta'}],['piso',[X+2,Y+Hc,2,4],{piso:'terra_batida'}],['piso',[X+8,Y+Hc,2,4],{piso:'terra_batida'}]]},{t:'ops',ops:[
    ['comodo',[X,Y,Wc,Hc],{par:'tijolo',piso:'madeira',esp:.3}],['parede',[X+6,Y,X+6,Y+Hc],{par:'tijolo'}],
    ['porta',[X+3,Y+Hc]],['porta',[X+9,Y+Hc]],['porta',[X+6,Y+4],{v:1}],['janela',[X+2,Y]],['janela',[X+9,Y]],['janela',[X,Y+4],{v:1}],['janela',[X+Wc,Y+4],{v:1}],
    ['obj','sl_tapete_sala',[X+3,Y+4]],['obj','sl_escrivaninha',[X+9,Y+1.5]],['obj','bl_cadeira',[X+9,Y+2.6,0]],['obj','bl_estante',[X+11,Y+3]],
    ['obj','sl_lampiao',[X+1,Y+1]],['obj','sl_lampiao',[X+11,Y+7]],['obj','sl_lampiao',[X+3.2,Y+Hc+4.2]],['obj','sl_lampiao',[X+9.2,Y+Hc+4.2]],['obj','pedra|rocha',[2,2]],['obj','pedra|rocha',[21,13]],['obj','pedra|rocha',[3,13.5]]]},{t:'copa',r:{x:1,y:6,w:4,h:4},o:{copa:'copa_densa'}},{t:'copa',r:{x:19,y:3,w:4.5,h:4.5},o:{copa:'copa_oasis'}},{t:'copa',r:{x:19,y:10.5,w:4,h:4},o:{copa:'copa_densa'}},{t:'copa',r:{x:2,y:0.4,w:3.5,h:3.5},o:{copa:'copa_oasis'}}],{semente:7});
   await E.especiais([]);
   const R=win.mesaRascunhoMapaV193;const r=await R.salvar();
   const rel={estado:r?.estado,edicoes:r?.edicoes,erro:r?.erro||null,pendentes:Number(R.pendentes||0)};
   diz('📋 Salvar: '+JSON.stringify(rel));
   if(r?.estado==='falhou'){diz('❌ O Firebase recusou: '+(r.erro.code?r.erro.code+' — ':'')+r.erro.message);try{R.descartar?.();}catch(_){}return;}
   if(r?.estado!=='confirmado'){diz('⚠️ Não confirmou (estado: '+(r?.estado||'sem retorno')+'). Mande este texto ao GPT.');return;}
   diz('✔ Mapa salvo no banco ('+(r.edicoes||0)+' alterações gravadas). Colocando o personagem de teste…');
   // o mapa novo precisa estar ABERTO antes de mexer no Kael (antes ele ia para o mapa que estava aberto, outro)
   for(let i=0;i<60&&String(ctl()?.mapaAtual?.()||'')!==String(id);i++){if(i===0||i===20)try{await ctl()?.openMap?.(id);}catch(_){}await new Promise(r=>setTimeout(r,150));}
   if(String(ctl()?.mapaAtual?.()||'')!==String(id))diz('⚠️ O mapa novo ainda não abriu na tela; abra "🏠 Casa de teste (básico)" em 🗂️ Mapas. O Kael vai ser colocado nele mesmo assim.');
   // criatura PRIMEIRO (colocar uma criatura seleciona ela e abre o cartão de comportamento)
   try{const c=ctl();if(String(c?.mapaAtual?.()||'')===String(id)&&c.place){await c.place('synccriatura:rastejante_de_cinzas',{x:+(19/24*28).toFixed(3),y:+(12/16*14).toFixed(3)},{instancia:true});await new Promise(r=>setTimeout(r,800));
    // atitude SANGUINÁRIA: sem atitude a criatura fica parada; assim ela caça e ataca o Kael
    try{const cr=(c.tokensNoMapa?.()||[]).filter(t=>{let r=String(t.id);try{r=decodeURIComponent(r);}catch(_){}return /^synccriatura:/.test(r);}).pop();if(cr)await dep.setDoc(dep.doc(dep.db,'combatesAtivos','mapaMesaSyncDireta','posicoes',String(cr.id)),{atitudeV200:'sanguinaria',grupoV200:'b',territorioMV200:0},{merge:true});}catch(_){}
    diz('🐛 Criatura de teste no jardim (Rastejante de Cinzas, 34%) — sanguinária: ela vai atrás do Kael.');}else diz('ℹ️ Não coloquei a criatura (o mapa novo não está aberto). Use ⚔️ Duelo de treino no painel 🧪.');}catch(e){diz('ℹ️ Criatura não colocada: '+(e?.message||e)+'. Use ⚔️ Duelo de treino no painel 🧪.');}
   try{await win.mesaTestePersonagem.iniciarComKael({mapaId:id,x:X+3,y:Y+4,W:24,H:16});}catch(e){diz('ℹ️ Kael indisponível ('+(e?.message||e)+'); usando um personagem descartável.');await win.mesaTestePersonagem?.colocar?.({quem:'pessoa',lanterna:true,posicaoM:[X+3,Y+4]});}
   try{const card=root.getElementById('mdCartao');if(card)card.hidden=true;root.querySelectorAll('[data-mc-fechar],#mdCartao [data-x]').forEach(b=>{try{b.click();}catch(_){}});}catch(_){}
   diz('✅ Pronto: casa fechada com o Kael dentro e uma criatura no jardim. Abra uma porta (clique nela), saia e ataque: selecione a criatura e use ⚔️ Atacar.');
  }catch(e){diz('⚠️ '+(e?.message||e));}
 }
 function abaJogador(){win.open(win.location.origin+win.location.pathname+'?verComo='+encodeURIComponent('teste_jogador_v138'),'_blank');} // o Kael de teste, sem precisar clicar na miniatura (que pode estar sob uma árvore)
 function html(){
  const L=lista(),princ=escolherPrincipal(L,aberto()),visiveis=L.filter(m=>!m.arquivadoV176),dup=visiveis.length>1;
  let pecas=-1;try{pecas=(ctl()?.cenaAtual?.()?.objects||[]).length;}catch(_){}const vazio=pecas>=0&&pecas<20&&L.some(m=>m.id===aberto());
  const linhas=L.length?L.map(m=>`<div class="ht-mapa${princ&&m.id===princ.id?' princ':''}"><div><b>${esc(m.nome)}</b>${m.id===aberto()?'<span class="ht-tag">aberto agora</span>':''}${m.arquivadoV176?'<span class="ht-tag" style="background:#3a3a1d;color:#e8e0a0">guardado</span>':''}${princ&&m.id===princ.id&&!m.arquivadoV176?'<span class="ht-tag">principal</span>':''}<br><small>${m.w||'?'}×${m.h||'?'} m · ${m.versao?'atualizado (v'+m.versao+')':(m.id===aberto()&&pecas>=0&&pecas<20?'<b style="color:#ffd27a">vazio</b>':'versão antiga')} · ${esc(m.id)}</small></div>
   <div class="ht-bt"><button type="button" data-abrir="${esc(m.id)}" class="pri">👁️ Abrir</button><button type="button" data-atualizar="${esc(m.id)}" title="Aplica as novidades do gerador neste mapa, com backup antes. Não cria mapa novo.">🛠️ Atualizar</button>${m.arquivadoV176?'':`<button type="button" data-guardar="${esc(m.id)}" title="Esconde do seletor sem apagar">🗄️ Guardar</button>`}</div></div>`).join(''):'<p><b>Ainda não existe nenhum mapa de teste.</b> Use "Criar o mapa de teste" abaixo.</p>';
  return `<div role="dialog" aria-label="Mapa de teste"><h3><span>🌿 Mapa de teste</span><button type="button" data-x>✕</button></h3>
  <p>O mapa de teste é um mapa grande (80 × 50 m) com floresta, lagoa, caverna, ruínas, lava e criaturas, feito para você experimentar o jogo. Tudo sobre ele fica aqui.</p>
  <h4>1 · Seus mapas de teste</h4>${vazio?`<p style="color:#ffd27a;background:#2a2110;border:1px solid #6d5320;border-radius:8px;padding:8px 10px">⚠️ O mapa de teste que está aberto está <b>vazio</b> (${pecas} peça(s)): nada do gerador foi aplicado nele. Clique em <b>🛠️ Atualizar</b> nele (uma vez, e espere o fim) para construir casa, ruínas, lagoa, caverna, criaturas e tudo o mais. Se existir outro mapa de teste já construído, use 👁️ Abrir nele.</p>`:''}${linhas}
  ${dup?`<p style="color:#ffd27a">⚠️ Há ${visiveis.length} cópias à mostra. Deixe só uma: clique em 🗄️ Guardar nas outras (elas não são apagadas).</p>`:''}
  <p><small>🛠️ <b>Atualizar</b> reconstrói <u>o mesmo mapa</u> com as novidades e faz backup antes (não cria mapa novo). <b>Faça uma vez e espere terminar</b>: repetir pode deixar peças duplicadas (problema conhecido). Só "Criar" faz um mapa novo.</small></p>
  <h4>2 · Experimentar</h4><div class="ht-grade">
   <button type="button" data-personagem>🧪 Testar com o Kael neste mapa<small>O Kael começa no mapa que está aberto agora (num ponto livre; no mapa de teste, no acampamento) e já fica selecionado. Depois abre o painel para levá-lo a cada lugar, equipar ou usar um personagem descartável.</small></button>
   <button type="button" data-aba>🎮 Abrir o Kael em outra aba (como jogador)<small>Abre uma aba nova onde você controla o Kael como um jogador (sem ferramentas de mestre). Deixe ESTA aba aberta: ela é quem processa os ataques.</small></button></div>
  <h4>3 · Organizar</h4><div class="ht-grade">
   <button type="button" data-mapas>🗂️ Guardar os outros mapas<small>Abre a lista de mapas. Lá, "Guardar todos (menos o de teste)" esconde todos de uma vez, sem apagar.</small></button>
   <button type="button" data-novo ${visiveis.length?'disabled title="Já existe um mapa de teste. Guarde-o antes se quiser criar outro."':''}>➕ Criar o mapa de teste<small>${visiveis.length?'Já existe um: use 👁️ Abrir ou 🛠️ Atualizar.':'Cria o mapa pela primeira vez (leva alguns segundos).'}</small></button></div>
  <div class="ht-grade" style="margin-top:8px"><button type="button" data-basico>🏠 Criar mapa BÁSICO (casa + personagem)<small>Teste simples para ver se criar, salvar e andar funcionam no banco real: uma casa de 2 cômodos com portas, janelas, móveis e um personagem de teste. Mostra o erro exato se algo falhar.</small></button><button type="button" data-descartar>↩️ Descartar alterações não salvas<small>Se o mapa ficou estranho (cachoeira sumiu, peças fora do lugar) depois de uma reforma que falhou: volta o mapa ao que está salvo no banco. Não apaga nada salvo.</small></button></div>
  <div class="ht-msg" id="htMsg">${esc(msg)}</div></div>`;
 }
 function desenhar(){const h=root.getElementById('hubTeste');if(h)h.firstElementChild.outerHTML=html();}
 function abrir(){
  if(!root.getElementById('hubTesteCss')){const st=root.createElement('style');st.id='hubTesteCss';st.textContent=CSS;root.head.append(st);}
  fechar();msg='';const d=root.createElement('div');d.id='hubTeste';d.innerHTML=html();root.body.append(d);
  d.addEventListener('pointerdown',e=>e.stopPropagation());
  d.addEventListener('click',e=>{
   if(e.target===d)return fechar();const b=e.target.closest('button');if(!b||b.disabled)return;
   if(b.hasAttribute('data-x'))return fechar();
   if(b.dataset.abrir)return void abrirMapa(b.dataset.abrir);
   if(b.dataset.atualizar)return atualizar(b.dataset.atualizar);
   if(b.dataset.guardar)return void guardar(b.dataset.guardar);
   if(b.hasAttribute('data-personagem')){fechar();(async()=>{try{await win.mesaTestePersonagem?.iniciarComKael?.();}catch(e){toast('⚠️ '+(e?.message||e));}win.mesaTestePersonagem?.abrirPainel?.();})();return;}
   if(b.hasAttribute('data-aba'))return abaJogador();
   if(b.hasAttribute('data-mapas')){fechar();win.mesaApagarMapasV173?.abrir?.();return;}
   if(b.hasAttribute('data-descartar')){try{const R=win.mesaRascunhoMapaV193,n=Number(R?.pendentes||0);R?.descartar?.();avisar(n?'↩️ Descartei '+n+' alteração(ões) não salvas: o mapa voltou ao que está no banco.':'Não havia alterações não salvas.');}catch(e){avisar('⚠️ '+(e?.message||e));}return;}
   if(b.hasAttribute('data-basico'))return void criarBasico();
   if(b.hasAttribute('data-novo'))return criarNovo();
  });
 }
 const api={abrir,fechar,lista,escolherPrincipal};win.mesaHubTeste=api;return api;
}
