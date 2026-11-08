// Mesa Estelar v138 — Véspera refeita: espaço-porto (mapa 1), Portão de Véspera no pico (mapa 2) e Ruas Escavadas em labirinto.
// Roda uma vez no navegador do mestre (marca em configuracoes/vesperaV138), com cópia de segurança dos mapas antigos.
// Também põe o personagem de teste do mestre no espaço-porto e o botão 🧪 "Ver como jogador".

import {gerarEspacoporto,gerarPortaoVespera,gerarRuasEscavadas,SAIDAS_ESPACOPORTO,SAIDAS_PORTAO,SAIDAS_RUAS,PORTAO} from './mesa-gerador-mapas.js?v=141';
import {cenaDoEstado,LIMITE_CENA} from './mesa-mapas-ui.js?v=141';
import {livrePerto} from './mesa-ligacoes.js?v=154';
import {renderizarMiniatura,specDeNpc,MARCA_MINI} from './mesa-miniaturas.js?v=194';

const clean=v=>JSON.parse(JSON.stringify(v??null));
const POS='combatesAtivos/mapaMesaSyncDireta/posicoes',LIGACOES='combatesAtivos/mesaLigacoes';
export const ID_PORTO='v138_espacoporto',ID_TESTE='teste_jogador_v138';
export const PRECISA=['pk_nave_grupo','pk_barraca_rubra','pk_portao_vespera','pk_plataforma_pouso'];
const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();

// Liga dois mapas com pontos dados (substitui ligação direta existente entre eles).
export function ligarFixo(ligs,a,pa,b,pb){
 const resto=(ligs||[]).filter(l=>!((String(l.a?.mapa)===a&&String(l.b?.mapa)===b)||(String(l.a?.mapa)===b&&String(l.b?.mapa)===a)));
 const velha=(ligs||[]).find(l=>(String(l.a?.mapa)===a&&String(l.b?.mapa)===b)||(String(l.a?.mapa)===b&&String(l.b?.mapa)===a));
 return [...resto,{id:velha?.id||('lig_v138_'+a+'_'+b),a:{mapa:a,x:pa.x,y:pa.y},b:{mapa:b,x:pb.x,y:pb.y},tipo:'porta',auto:true}];
}
// Cena com o portão trancado (só Denzel abre).
export function trancarPortao(cena){return {...cena,objects:(cena.objects||[]).map(o=>/^port[aã]o de v[eé]spera$/i.test(String(o.nome||''))?{...o,estadoInterativo:{...(o.estadoInterativo||{}),trancado:true,aberto:false,dificuldade:'dificil'}}:o)};}

export function instalarVespera(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const D=p=>dep.doc(dep.db,p);
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 const toast=(t,ms=12000)=>{const n=root.createElement('div');n.textContent=t;n.style.cssText='position:fixed;left:16px;bottom:110px;z-index:9999;background:#2a2214;border:1px solid #ffd447;color:#ffe9a8;padding:9px 14px;border-radius:12px;font:600 13px Segoe UI,Arial,sans-serif;max-width:560px';root.body.append(n);setTimeout(()=>n.remove(),ms);};
 let feito=false,rodando=false,tentativasV141=0;

 async function backup(id){
  try{const m=await dep.getDoc(D('mapas/'+id));if(m.exists())await dep.setDoc(D('combatesAtivos/backupMapa_'+id+'_v138'),clean({em:new Date().toISOString(),mapa:m.data()}));}catch(e){console.warn('[Véspera] backup mapa',id,e);}
  try{const s=await dep.getDoc(D('combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(id)));if(s.exists())await dep.setDoc(D('combatesAtivos/backupCena_'+id+'_v138'),clean({em:new Date().toISOString(),cena:s.data()}));}catch(e){console.warn('[Véspera] backup cena',id,e);}
 }
 async function salvar(id,nome,state,ajustar=c=>c){
  const api=win.mesaMapasV110_;let cenaFinal=null;
  await api.salvar({id,nome,state,cenaDe:mid=>{const c=ajustar(cenaDoEstado(state,mid));cenaFinal=c;return JSON.stringify(c).length<=LIMITE_CENA?c:null;}});
  await dep.setDoc(D('mapas/'+id),{remodeladoV138:{em:new Date().toISOString(),backup:'combatesAtivos/backupMapa_'+id+'_v138'},...(state.portaoV138?{portaoV138:true}:{}),...(state.espacoportoV138?{espacoportoV138:true}:{}),...(state.ruasV138?{ruasV138:true}:{})},{merge:true});
  try{const m=(dep.mapas?.()||[]).find(x=>String(x.id)===id);if(m)Object.assign(m,{portaoV138:!!state.portaoV138,espacoportoV138:!!state.espacoportoV138,ruasV138:!!state.ruasV138});}catch(_){}
  return cenaFinal;
 }
 // tokens que ficaram dentro de rocha/parede vão para o lugar livre mais perto
 async function acomodar(id,cena,W,H,especiais={}){
  const objs=cena?.objects||[];const tokens=(ctl()?.todosTokens?.()||[]).filter(t=>String(t.mapaId||'')===id);const ocup=[...objs];
  for(const t of tokens){
   const k=decodeURIComponent(String(t.id)),alvo=especiais[k]||{x:Number(t.x),y:Number(t.y)},p=livrePerto(ocup,alvo.x,alvo.y,W,H,.6);
   ocup.push({x:p.x,y:p.y,larguraM:1,alturaM:1,bloqueiaMovimento:true});
   if(Math.hypot(p.x-Number(t.x),p.y-Number(t.y))<.02)continue;
   try{await dep.runTransaction(dep.db,async tx=>{const r=D(POS+'/'+t.id),s=await tx.get(r);if(!s.exists())return;tx.set(r,{...s.data(),x:+p.x.toFixed(3),y:+p.y.toFixed(3),revision:Number(s.data().revision||0)+1});});}catch(e){console.warn('[Véspera] token',k,e);}
  }
 }
 async function colocarNpc(npcId,mapId,p,{copia=false}={}){
  const npcs=dep.npcs?.()||[],m=npcs.find(n=>String(n.id)===npcId);if(!m)return false;
  const todos=ctl()?.todosTokens?.()||[],base='syncnpc:'+npcId;
  if(!copia){const ja=todos.find(t=>decodeURIComponent(String(t.id))===base);
   if(ja){await dep.runTransaction(dep.db,async tx=>{const r=D(POS+'/'+ja.id),s=await tx.get(r);if(!s.exists())return;tx.set(r,{...s.data(),mapaId:mapId,x:p.x,y:p.y,revision:Number(s.data().revision||0)+1});});return true;}}
  let id=base;for(let k=2;todos.some(t=>decodeURIComponent(String(t.id))===id);k++)id=base+'~'+k;
  await dep.setDoc(D(POS+'/'+encodeURIComponent(id)),clean({nome:String(m.nome||npcId)+(id.includes('~')?' '+id.split('~')[1]:''),imagem:String(m.miniatura?.url||m.imagem||''),donoUid:'',x:+p.x.toFixed(3),y:+p.y.toFixed(3),revision:0,facing:Math.PI/2,camada:3,mapaId:mapId,diametroM:1}));
  return true;
 }
 // v142: leva o personagem de teste para o Espaço-porto (mapa 1) — ficha e miniatura
 async function recomecarTeste(){
  const c=await win.criarPersonagemTesteV138_?.();if(!c)return false;
  let cena=null;try{const s=await dep.getDoc(D('combatesAtivos/mapaMesaSyncCena_'+ID_PORTO));if(s.exists())cena=s.data();}catch(_){}
  const p=livrePerto(cena?.objects||[],2.6,7.2,84,42,.7),ref=D(POS+'/'+encodeURIComponent(ID_TESTE));
  await dep.runTransaction(dep.db,async tx=>{const s=await tx.get(ref),v=s.exists()?s.data():null;
   tx.set(ref,clean({...(v||{nome:c.nome||'Kael Teste',imagem:String(c.miniatura?.url||c.imagem||''),donoUid:String(c.dono||dep.uid?.()||''),facing:0,camada:3,diametroM:1}),x:+p.x.toFixed(3),y:+p.y.toFixed(3),mapaId:ID_PORTO,revision:v?Number(v.revision||0)+1:0}));});
  await dep.setDoc(D('personagens/'+ID_TESTE),{localizacaoMapaId:ID_PORTO,localizacaoMapaDefinidaV92:true,localizacaoCenarioId:''},{merge:true});
  return true;
 }
 // v142: miniatura do Kael Teste (aventureiro humano com pistola e faca)
 let miniKael=false;
 async function miniaturaKael(){
  if(miniKael||!ehMestre()||!dep.uploadBytes)return;miniKael=true;
  try{const s=await dep.getDoc(D('personagens/'+ID_TESTE));if(!s.exists()){miniKael=false;return;}const c=s.data();let url=String(c.miniatura?.url||'');
   if(!url){const sp=specDeNpc({id:ID_TESTE,nome:'Kael Teste',raca:'Humano',carreira:'Aventureiro',sexo:'M',armasTexto:'Pistola Laser|Faca Utilitária'});
    const blob=new Blob([renderizarMiniatura(sp)],{type:'image/svg+xml'});
    const snap=await dep.uploadBytes(dep.ref(dep.storage,`personagens/${String(dep.uid?.()||'')}/miniaturas/${ID_TESTE}.svg`),blob,{contentType:'image/svg+xml',cacheControl:'public,max-age=31536000'});
    url=(await dep.getDownloadURL(snap.ref))+MARCA_MINI;
    await dep.setDoc(D('personagens/'+ID_TESTE),{miniatura:{url,spec:sp,tipo:'montada',atualizadoEm:new Date().toISOString()},imagem:url},{merge:true});}
   // a miniatura da ficha vai para a peça no mapa (ela estava sem imagem)
   const ref=D(POS+'/'+encodeURIComponent(ID_TESTE));await dep.runTransaction(dep.db,async tx=>{const p=await tx.get(ref);if(!p.exists()||String(p.data().imagem||'')===url)return;tx.set(ref,{...p.data(),imagem:url,revision:Number(p.data().revision||0)+1});});
   const loc=(dep.personagens?.()||[]).find(x=>String(x.id)===ID_TESTE);if(loc){loc.miniatura={url};loc.imagem=url;}
  }catch(e){console.warn('[Véspera] miniatura do Kael',e);miniKael=false;}
 }
 let kaelV142=false;
 let kaelPromessa=null;
 function corrigirKaelUmaVez(){if(!kaelPromessa||kaelV142===false)kaelPromessa=corrigirKael();return kaelPromessa;}
 async function corrigirKael(){
  if(kaelV142||!ehMestre()||!(dep.mapas?.()||[]).some(m=>String(m.id)===ID_PORTO))return;kaelV142=true;
  const flag=D('configuracoes/kaelInicioV142');try{if((await dep.getDoc(flag)).exists())return;}catch(_){kaelV142=false;return;}
  try{if(await recomecarTeste())await dep.setDoc(flag,{em:new Date().toISOString()});else kaelV142=false;}catch(e){console.warn('[Véspera] Kael',e);kaelV142=false;}
 }
 async function colocarTeste(cena){
  const c=await win.criarPersonagemTesteV138_?.();if(!c)return false;
  const todos=ctl()?.todosTokens?.()||[];if(todos.some(t=>decodeURIComponent(String(t.id))===ID_TESTE))return true;
  const p=livrePerto(cena?.objects||[],2,7,84,42,.7);
  await dep.setDoc(D(POS+'/'+encodeURIComponent(ID_TESTE)),clean({nome:c.nome||'Kael Teste',imagem:String(c.miniatura?.url||c.imagem||''),donoUid:String(c.dono||dep.uid?.()||''),x:+p.x.toFixed(3),y:+p.y.toFixed(3),revision:0,facing:0,camada:3,mapaId:ID_PORTO,diametroM:1}));
  return true;
 }
 async function montar(){
  if(feito||rodando||!ehMestre())return;
  const api=win.mesaMapasV110_,objs=dep.objetos?.()||[],mapas=dep.mapas?.()||[];
  if(!api?.salvar||!mapas.length||!ctl()?.todosTokens)return;
  if(!PRECISA.every(id=>objs.some(o=>String(o.id)===id)))return; // o pacote de objetos v138 ainda está entrando
  const flag=D('configuracoes/vesperaV138');
  try{if((await dep.getDoc(flag)).exists()){feito=true;return;}}catch(_){return;}
  if(++tentativasV141>2){feito=true;return;} // v141: se falhar, não fica repetindo (evita cópias em série)
  rodando=true;const feitos=[];
  try{
   const portao=mapas.find(m=>String(m.id)==='cenario_c001')||mapas.find(m=>/port[aã]o de v[eé]spera/i.test(m.nome||''));
   const ruas=mapas.find(m=>String(m.id)==='cenario_c002')||mapas.find(m=>/ruas escavadas/i.test(m.nome||''));
   // 1) espaço-porto (novo)
   const stP=gerarEspacoporto({objetos:objs});
   const cenaP=await salvar(ID_PORTO,'Espaço-porto de Véspera',stP);feitos.push('Espaço-porto de Véspera (84×42 m, com a nave do grupo)');
   // 2) portão
   let cenaG=null,cenaR=null;
   if(portao){await backup(String(portao.id));const st=gerarPortaoVespera({objetos:objs,nome:portao.nome||'Portão de Véspera'});cenaG=await salvar(String(portao.id),portao.nome||'Portão de Véspera',st,trancarPortao);feitos.push('Portão de Véspera no pico, com barracas e o pedágio de Denzel');}
   if(ruas){await backup(String(ruas.id));const st=gerarRuasEscavadas({objetos:objs,nome:ruas.nome||'Ruas Escavadas de Véspera'});cenaR=await salvar(String(ruas.id),ruas.nome||'Ruas Escavadas de Véspera',st);feitos.push('Ruas Escavadas maiores e em labirinto (56×28 m)');}
   // 3) cenário C000 do espaço-porto
   const cens=dep.cenarios?.()||[];
   if(!cens.some(c=>String(c.mapaId||'')===ID_PORTO)){
    const id=cens.some(c=>String(c.id)==='C000')?'C000b':'C000';
    const c={id,nome:'Espaço-porto de Véspera',local:'Véspera - Espaço-porto',tipo:'Social/Transporte/Chegada',estadoInicial:'Chegada',
     descricaoJogadores:'Plataformas de pouso cravadas na areia branca, ao pé do pico onde Véspera cresceu. Cargueiros enferrujados, um transporte de passageiros e a nave do grupo descansam sob o sol. Uma trilha leva até o portão de rocha da cidade.',
     descricaoGM:'Ponto de chegada do grupo. Daqui se vai a pé até o Portão de Véspera, onde Denzel cobra a entrada.',objetivo:'Começo da campanha em Véspera.',
     destino1:portao?String((cens.find(x=>String(x.mapaId||'')===String(portao.id))||{}).id||'C001'):'C001',condicao1:'Seguir a trilha até o portão',mapaId:ID_PORTO,npcsCena:'',personagensCenaIds:'',personagensVisiveisIds:''};
    await dep.setDoc(D('cenarios/'+id),c,{merge:true});try{cens.push(c);}catch(_){}
   }
   // 4) ligações: porto (leste) ↔ portão (oeste); portão (norte, atrás do portão) ↔ ruas (sul)
   try{const s=await dep.getDoc(D(LIGACOES));let ligs=s.exists()?(s.data().ligacoes||[]):[];
    if(portao)ligs=ligarFixo(ligs,ID_PORTO,SAIDAS_ESPACOPORTO.portao,String(portao.id),SAIDAS_PORTAO.espacoporto);
    if(portao&&ruas)ligs=ligarFixo(ligs,String(portao.id),SAIDAS_PORTAO.ruas,String(ruas.id),SAIDAS_RUAS.portao);
    await dep.setDoc(D(LIGACOES),clean({ligacoes:ligs,atualizadoEm:Date.now(),ladosV138:true}));}catch(e){console.warn('[Véspera] ligações',e);}
   // 5) gente no lugar: Denzel diante do portão, comerciantes nas barracas, ninguém dentro da rocha
   if(portao){const id=String(portao.id),W=56,H=28,n=x=>x*28/W,m=y=>y*14/H;
    await colocarNpc('guarda_do_portao_1',id,{x:n(PORTAO.gateX-2.2),y:m(11.6)});
    for(const [x,y] of [[8,16.4],[43,18.9],[46,23.4]])try{if(win.mesaComerciantes?.novo)await win.mesaComerciantes.novo(id,n(x),m(y),{ambulante:x===43});}catch(e){console.warn('[Véspera] comerciante',e);} // v141: genéricos, de raças diferentes
    await acomodar(id,cenaG,W,H);}
   if(ruas&&cenaR)await acomodar(String(ruas.id),cenaR,56,28);
   // 6) personagem de teste no espaço-porto, ao lado da nave
   try{if(await colocarTeste(cenaP))feitos.push('personagem de teste “Kael Teste” ao lado da nave');}catch(e){console.warn('[Véspera] teste',e);}
   await dep.setDoc(flag,{em:new Date().toISOString(),feitos});feito=true;
   toast('🏜️ Véspera refeita: '+feitos.join(' · ')+'. Os mapas antigos ficaram guardados como cópia de segurança.');
   const atual=String(ctl()?.mapaAtual?.()||'');if([ID_PORTO,String(portao?.id||''),String(ruas?.id||'')].includes(atual))try{ctl()?.refreshView?.();}catch(_){}
  }catch(e){console.warn('[Véspera]',e);try{await dep.setDoc(flag,{em:new Date().toISOString(),feitos,erro:String(e?.message||e)});feito=true;}catch(_){}}
  finally{rodando=false;}
 }

 // ------------------------------------------------------------ 🧪 ver como jogador
 function botaoTeste(){
  let b=root.getElementById('mesaVerJogador');
  const mostrar=ehMestre()&&!win.mesaModoJogadorV138_;
  if(!mostrar){b?.remove();}
  else if(!b){b=root.createElement('button');b.type='button';b.id='mesaVerJogador';b.textContent='🧪';
   b.title='Teste e construção: ver como jogador (Kael Teste), construtor e Oficina 3.0.';b.setAttribute('aria-label',b.title);
   b.style.cssText='position:fixed;left:16px;bottom:96px;z-index:9998;width:34px;height:34px;border-radius:50%;border:1px solid #ffd447;background:#2a2214;color:#ffe9a8;font-size:17px;cursor:pointer;padding:0';
   // v193: o 🧪 abre um menu: ver como jogador (Kael), construtor (andar e construir) e Oficina 3.0
   const verComoJogador=async()=>{try{await win.criarPersonagemTesteV138_?.();}catch(_){}const u=new URL(win.location.href);u.searchParams.set('verComo','jogador');win.open(u.toString(),'_blank');};
   const fecharMenu=()=>root.getElementById('mesaMenuTeste')?.remove();
   b.addEventListener('click',()=>{
    if(root.getElementById('mesaMenuTeste')){fecharMenu();return;}
    const m=root.createElement('div');m.id='mesaMenuTeste';
    m.style.cssText='position:fixed;left:58px;bottom:96px;z-index:9999;display:flex;flex-direction:column;gap:4px;padding:8px;border-radius:12px;background:rgba(20,16,10,.97);border:1px solid #ffd447;box-shadow:0 12px 34px rgba(0,0,0,.55);font:13px Segoe UI,Arial,sans-serif;min-width:250px';
    const itens=[['👷 Construtor (outra aba)','Abre uma aba onde Brunel Obras anda e constrói neste mapa; esta aba fica livre',()=>{const u=new URL(win.location.href);u.searchParams.set('construtor','1');u.searchParams.delete('verComo');win.open(u.toString(),'_blank');}],
     ['👷 Construtor (nesta aba)','Andar com o construtor aqui mesmo (WASD ou controle)',()=>{const o=win.mesaOficina3V175;if(!o?.construtor){win.alert('A Oficina 3.0 ainda está carregando. Tente de novo em instantes.');return;}o.construtor.entrar();}],
     ['🏘️ Começar o bairro','Cidade Baixa vazia e pequena; só Portão e Escadaria ligados (com cópia de segurança)',()=>{const o=win.mesaBairroV195;if(!o){win.alert('Ainda carregando. Tente de novo em instantes.');return;}void o.preparar();}],
     ['🎨 Editor rápido','Construir pintando: paredes, cômodos, pisos, portas e móveis (como o RPG Map)',()=>{const o=win.mesaEditorRapidoV197;if(!o){win.alert('O editor ainda está carregando. Tente de novo em instantes.');return;}o.abrir();}],
     ['🏗️ Oficina 3.0','Paredes, cômodos, chão, teto, portas, pincéis e objetos',()=>{const o=win.mesaOficina3V175;if(!o){win.alert('A Oficina 3.0 ainda está carregando. Tente de novo em instantes.');return;}o.abrir();}],
     ['🧪 Ver como jogador','Abre outra aba com o Kael Teste (tudo em 50%)',verComoJogador]];
    for(const [t,d,f] of itens){const x=root.createElement('button');x.type='button';x.style.cssText='display:flex;flex-direction:column;align-items:flex-start;gap:1px;padding:7px 10px;border-radius:9px;border:1px solid #5a4a22;background:#2a2214;color:#ffe9a8;cursor:pointer;text-align:left';
     x.innerHTML='<b>'+t+'</b><small style="color:#c9b27a">'+d+'</small>';x.addEventListener('click',()=>{fecharMenu();f();});m.append(x);}
    root.body.append(m);
    const fora=e=>{if(!m.contains(e.target)&&e.target!==b){fecharMenu();root.removeEventListener('pointerdown',fora,true);}};root.addEventListener('pointerdown',fora,true);
   });
   root.body.append(b);}
  let f=root.getElementById('mesaFaixaJogador');
  if(win.mesaModoJogadorV138_&&!f&&!win.__faixaJogadorVista&&root.body){win.__faixaJogadorVista=true;f=root.createElement('div');setTimeout(()=>f.remove(),9000);f.id='mesaFaixaJogador';
   const dirTok=win.mesaDiretorV206_?(ctl()?.todosTokens?.()||[]).find(t=>String(t.id)===String(win.mesaDiretorV206_)):null;
  const quem=dirTok?`🎬 Modo diretor: você está atuando como <b>${String(dirTok.nome||'token escolhido').replace(/</g,'&lt;')}</b>`:'🧪 Você está vendo como jogador (Kael Teste)';
  f.innerHTML=quem+'. Deixe a outra aba aberta como mestre: é ela que abre portas, cobra o pedágio e leva o grupo entre mapas. <button type="button" title="Voltar a ser mestre nesta aba" style="margin-left:8px;border:1px solid #ffd447;background:#3a2e14;color:#ffe9a8;border-radius:8px;cursor:pointer">↩ Voltar a ser mestre</button>';
   f.style.cssText='position:fixed;left:50%;top:6px;transform:translateX(-50%);z-index:10001;background:rgba(42,34,20,.95);border:1px solid #ffd447;color:#ffe9a8;padding:6px 12px;border-radius:10px;font:600 12px Segoe UI,Arial,sans-serif;max-width:min(860px,94vw);text-align:center;pointer-events:auto';
   f.querySelector('button').addEventListener('click',()=>{const u=new URL(win.location.href);u.searchParams.delete('verComo');win.location.href=u.toString();});
   if(!win.mesaDiretorV206_){const rb=root.createElement('button');rb.type='button';rb.textContent='↺ Recomeçar no Espaço-porto';rb.title='Leva o Kael Teste de volta ao mapa 1 (Espaço-porto), ao lado da nave';rb.style.cssText='margin-left:8px;border:1px solid #ffd447;background:#3a2e14;color:#ffe9a8;border-radius:8px;cursor:pointer';
   rb.addEventListener('click',async()=>{rb.disabled=true;try{await recomecarTeste();win.location.reload();}catch(e){console.warn(e);rb.disabled=false;}});f.append(rb);}root.body.append(f);}
 }
 // ------------------------------------------------------------ 🎬 modo diretor (v206)
 function botaoDiretor(){
  let b=root.getElementById('mesaDiretor');
  const mostrar=ehMestre()&&!win.mesaModoJogadorV138_;
  if(!mostrar){b?.remove();root.getElementById('mesaDiretorPainel')?.remove();return;}
  if(b)return;
  b=root.createElement('button');b.type='button';b.id='mesaDiretor';b.textContent='🎬';
  b.title='Modo diretor: abre outra aba onde você joga como um PJ/NPC/criatura que acompanha o grupo, com visão de jogador (névoa, lanterna, sem poderes de mestre). Esta aba continua sendo a do mestre.';
  b.setAttribute('aria-label',b.title);
  b.style.cssText='position:fixed;left:16px;bottom:136px;z-index:9998;width:34px;height:34px;border-radius:50%;border:1px solid #57e3a1;background:#12241c;color:#a8f5cf;font-size:16px;cursor:pointer;padding:0';
  b.addEventListener('click',()=>painelDiretor());
  root.body.append(b);
 }
 function painelDiretor(){
  const antigo=root.getElementById('mesaDiretorPainel');if(antigo){antigo.remove();return;}
  const mid=String(ctl()?.mapaAtual?.()||'');
  const toks=(ctl()?.todosTokens?.()||[]).filter(t=>t&&t.id&&String(t.mapaId||'')===mid&&!/^dummy:/.test(String(t.id)));
  const p=root.createElement('div');p.id='mesaDiretorPainel';
  const opt=t=>`<option value="${String(t.id).replace(/"/g,'&quot;')}">${String(t.nome||'token').replace(/</g,'&lt;')}</option>`;
  p.innerHTML=`<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><b>🎬 Modo diretor</b><select id="mesaDiretorSel" style="flex:1;min-width:180px;background:#0d1626;color:#dfe8f5;border:1px solid #57e3a1;border-radius:8px;padding:5px 8px;font:12px Segoe UI,Arial,sans-serif">${toks.map(opt).join('')}</select><button type="button" id="mesaDiretorAbrir" style="border:1px solid #57e3a1;background:#12241c;color:#a8f5cf;border-radius:8px;cursor:pointer;padding:5px 10px">Abrir aba ▶</button><button type="button" id="mesaDiretorFechar" title="Fechar" style="border:1px solid #4a5a72;background:#101a2c;color:#c6d3e6;border-radius:8px;cursor:pointer;padding:5px 8px">✕</button></div><div style="margin-top:6px;font-size:11px;color:#9fb4d0">Você joga como o token escolhido — visão de jogador (névoa, escuridão, lanterna em cone), sem barras de mestre. O combate continua sendo conduzido nesta janela, do seu lado de mestre. Não há tokens no mapa atual? Coloque-os pela barra do mestre antes.</div>`;
  p.style.cssText='position:fixed;left:16px;bottom:178px;z-index:9999;background:rgba(13,22,38,.97);border:1px solid #57e3a1;color:#dfe8f5;padding:10px 12px;border-radius:12px;font:12px Segoe UI,Arial,sans-serif;max-width:min(480px,92vw);box-shadow:0 6px 24px rgba(0,0,0,.5)';
  root.body.append(p);
  p.querySelector('#mesaDiretorFechar').addEventListener('click',()=>p.remove());
  p.querySelector('#mesaDiretorAbrir').addEventListener('click',()=>{
   const id=p.querySelector('#mesaDiretorSel')?.value;if(!id)return;
   const u=new URL(win.location.href);u.searchParams.set('verComo',encodeURIComponent(String(id)));win.open(u.toString(),'_blank');p.remove();});
 }
 // v195: aba aberta por ?construtor=1 entra no modo construtor quando a Oficina 3.0 e um mapa estiverem prontos
 let construtorIniciado=false;
 function abaConstrutor(){
  if(construtorIniciado||!ehMestre())return;let q=false;try{q=new URL(win.location.href).searchParams.get('construtor')==='1';}catch(_){}if(!q){construtorIniciado=true;return;}
  const o=win.mesaOficina3V175;if(!o?.construtor||!(dep.mapas?.()||[]).length||!ctl()?.dimsAtual)return;
  construtorIniciado=true;try{o.construtor.entrar();}catch(e){console.warn('[Véspera] construtor',e);}
  if(root.body&&!root.getElementById('mesaFaixaConstrutor')){const f=root.createElement('div');f.id='mesaFaixaConstrutor';f.textContent='👷 Aba do construtor: Brunel Obras constrói neste mapa. Salve o mapa no painel da Oficina 3.0.';f.style.cssText='position:fixed;left:50%;top:6px;transform:translateX(-50%);z-index:10001;background:rgba(58,36,12,.95);border:1px solid #ffb86b;color:#ffe2bf;padding:6px 12px;border-radius:10px;font:600 12px Segoe UI,Arial,sans-serif;max-width:min(860px,94vw);text-align:center';root.body.append(f);setTimeout(()=>f.remove(),9000);}
 }
 const vigia=setInterval(()=>{try{abaConstrutor();botaoTeste();botaoDiretor();void montar();if(feito){void corrigirKaelUmaVez().then(()=>miniaturaKael()).catch(()=>{});}}catch(e){console.warn('[Véspera]',e);}},2500);
 win.mesaVespera={montar,recomecarTeste,miniaturaKael,feito:()=>feito};
 return {parar(){clearInterval(vigia);}};
}
