// Mesa Estelar v147 — Conversas com NPCs de nome (Maelia Varen, Darek Sol, Ilü-Mus-Ki, Nilo, Dra. Ilya Nemer…).
//
// • Fora de combate, o jogador clica no NPC (perto dele) e abre uma conversa: quadro com o retrato do NPC ao lado,
//   as falas e as escolhas/testes. Botão direito no NPC continua abrindo atacar/perícia/psi.
// • A conversa é do GRUPO: quem estiver perto vê as mesmas falas, escolhas e resultados, e tudo vai para o histórico.
// • Testes visíveis (Influência, Intimidação, Comércio, Enganação…) mostram o dado para todos. Testes ocultos
//   (Psicologia, Intuição, Percepção) mostram o dado só para o mestre; os jogadores recebem só a consequência.
// • O mestre fala pelo NPC (caixa “Fala de …”), vê os testes ocultos e pode reescrever a consequência antes de enviar.
// • Em combate não abre; se o combate começar, a conversa fecha.
// O jogador só faz pedidos (combatesAtivos/mesaConversas/acoes); o navegador do mestre rola e grava. Módulo à parte.

import {classificarTeste} from './nova-regras.js?v=46';
import {npcUnico} from './mesa-limpeza.js?v=153';
import {TESTES_CENARIOS} from './mesa-sessao-cenarios.js?v=117';
import {retratoDoNpc} from './mesa-retratos.js?v=148';

const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clean=v=>JSON.parse(JSON.stringify(v??null));
const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
export const ESTADO='combatesAtivos/mesaConversas',PEDIDOS=ESTADO+'/acoes',HIST='combatesAtivos/mapaMesaSyncHistorico';
export const ALCANCE=3.6,VER=8,MAX_LINHAS=80;
const DIF={'muito fácil':2,'fácil':1.5,'padrão':1,'difícil':2/3,'formidável':.5,'hercúleo':.1};
export const OCULTAS=/psicologia|intui|percep/;

// Testes de conversa preparados para os NPCs principais (consequências curtas; segredos maiores ficam com o mestre).
const PREPARADOS=[
 {quem:/maelia/,testes:[
  {id:'audiencia',titulo:'Pedir uma audiência',pericia:'Influência',dif:'Padrão',sucesso:'Maelia aceita ouvi-los, longe dos outros conselheiros. — Falem. Tenho alguns minutos.',falha:'— A Câmara tem pauta. Marquem pelos canais devidos.'},
  {id:'valloton',titulo:'Perguntar sobre Valloton',pericia:'Influência',dif:'Difícil',sucesso:'— Valloton reformou esta Câmara. Metade destes assentos é da Cidade Baixa por causa dele. O que veio depois… não é assunto para corredor.',falha:'— Muita gente pergunta por Valloton. Poucos merecem resposta.'},
  {id:'ler',titulo:'Ler as intenções dela',pericia:'Psicologia',dif:'Difícil',sucesso:'Ela mede cada palavra. Quando o nome de Valloton aparece, há respeito sincero — e algo parecido com culpa.',falha:'Maelia é difícil de ler; o rosto dela não entrega nada.'},
  {id:'ouvidos',titulo:'Reparar em quem está ouvindo',pericia:'Percepção',dif:'Padrão',sucesso:'Um conselheiro finge ler, mas acompanha cada palavra. Um guarda perto da porta também.',falha:'Nada fora do comum.'}]},
 {quem:/darek/,testes:[
  {id:'ajuda',titulo:'Pedir a ajuda da Guarda',pericia:'Influência',dif:'Padrão',sucesso:'— Contem comigo. Só não me façam escolher entre vocês e a Guarda em público.',falha:'— Agora não. Tem olhos demais aqui.'},
  {id:'presos',titulo:'Perguntar sobre os prisioneiros',pericia:'Influência',dif:'Difícil',sucesso:'Darek baixa a voz: — Gente some das celas e ninguém registra para onde vai. Eu quero acabar com isso.',falha:'— Não sei do que vocês estão falando.'},
  {id:'ler',titulo:'Ler as intenções dele',pericia:'Psicologia',dif:'Padrão',sucesso:'Ele está do lado de vocês — e com medo do que pode acontecer se falar demais.',falha:'Darek é soldado; o rosto dele não entrega muita coisa.'}]},
 {quem:/ilu|mus.?ki/,testes:[
  {id:'valloton',titulo:'Perguntar sobre Valloton',pericia:'Influência',dif:'Padrão',sucesso:'As antenas de Ilü baixam. — Eu devo muito a ele. Muito mais do que gostaria de admitir.',falha:'— Assuntos antigos. Deixemos onde estão.'},
  {id:'favor',titulo:'Negociar um favor',pericia:'Comércio',dif:'Padrão',sucesso:'— Um favor por um favor. Gosto de gente que entende de troca.',falha:'— Vocês não têm nada que me interesse… ainda.'},
  {id:'ler',titulo:'Ler as intenções',pericia:'Psicologia',dif:'Difícil',sucesso:'Ilü fala de Valloton com gratidão genuína, mas desvia sempre que o assunto chega à origem da própria fortuna.',falha:'Impossível ler um insetoide como Ilü.'}]},
 {quem:/\bnilo\b/,testes:[
  {id:'cantil',titulo:'Cobrar o cantil roubado',pericia:'Intimidação',dif:'Padrão',sucesso:'Nilo devolve o cantil, emburrado. — Tava só guardando pra vocês.',falha:'Nilo some entre as pernas da multidão.'},
  {id:'amizade',titulo:'Fazer amizade',pericia:'Influência',dif:'Padrão',sucesso:'— Me paguem um lanche e eu conto onde os guardas não olham.',falha:'Nilo desconfia e fica de longe.'}]},
 {quem:/ilya/,testes:[
  {id:'desculpas',titulo:'Pedir desculpas pela leitura mental',pericia:'Influência',dif:'Difícil',sucesso:'Ilya respira fundo. — Tudo bem. Mas da próxima vez, perguntem.',falha:'— Saiam da minha clínica.'},
  {id:'ler',titulo:'Ler as intenções dela',pericia:'Psicologia',dif:'Padrão',sucesso:'Ela está furiosa, mas não com vocês: com alguma coisa que viu e não pode contar.',falha:'Ela só parece cansada.'}]}
];
// Testes da sessão (mesa-sessao-cenarios) que citam o NPC pelo nome.
function testesDaSessao(nome){
 const n=sem(nome),partes=n.split(/\s+/).filter(p=>p.length>=4&&!/^(dra|doutor|doutora|lord|lady)$/.test(p.replace('.','')));if(!partes.length)return [];
 const out=[];for(const [cen,lista] of Object.entries(TESTES_CENARIOS||{}))for(const [i,t] of (lista||[]).entries()){const tt=sem(t.titulo);if(!partes.some(p=>tt.includes(p)))continue;
  const per=String(t.pericias||'').split(';').map(s=>s.trim()).filter(Boolean)[0];if(!per)continue;
  out.push({id:'s_'+cen+'_'+i,titulo:t.titulo,pericia:per,dif:t.dificuldade||'Padrão',sucesso:t.sucesso,critico:t.critico,falha:t.falha,evidente:t.evidente});}
 return out;
}
// Lista de testes de conversa para um NPC (preparados + da sessão + genéricos).
export function testesDoNpc(nome){
 const n=sem(nome),prep=(PREPARADOS.find(p=>p.quem.test(n))?.testes||[]).map(t=>({...t}));
 const ses=testesDaSessao(nome).filter(t=>!prep.some(p=>sem(p.titulo)===sem(t.titulo)));
 const gen=[
  {id:'g_conversar',titulo:'Puxar conversa',pericia:'Influência',dif:'Padrão',sucesso:`${nome} se mostra disposto(a) a conversar e ajudar no que puder.`,falha:`${nome} responde com poucas palavras.`},
  {id:'g_ler',titulo:'Ler as intenções',pericia:'Psicologia',dif:'Padrão',sucesso:'',falha:''},
  {id:'g_pressionar',titulo:'Pressionar',pericia:'Intimidação',dif:'Difícil',sucesso:`${nome} cede um pouco, contrariado(a).`,falha:`${nome} fecha a cara. A conversa esfriou.`},
  {id:'g_enganar',titulo:'Contar uma história',pericia:'Enganação',dif:'Padrão',sucesso:`${nome} parece acreditar.`,falha:`${nome} desconfia da história.`}
 ].filter(g=>!prep.some(p=>p.pericia===g.pericia&&/ler|conversa/i.test(p.titulo+g.titulo)&&OCULTAS.test(sem(p.pericia))===OCULTAS.test(sem(g.pericia))&&g.id!=='g_conversar'));
 return [...prep,...ses,...gen].map(t=>({...t,oculto:OCULTAS.test(sem(t.pericia))}));
}
// Chance com dificuldade.
export function chance(valor,dif='Padrão'){return Math.max(1,Math.min(99,Math.round((Number(valor)||0)*(DIF[sem(dif).replace('padrao','padrão')]??DIF[String(dif).toLowerCase()]??1))));}
// Retrato: imagem do NPC, da miniatura, ou um retrato com as iniciais.
export function retratoDe(npc,token){
 const ok=v=>typeof v==='string'&&/^(https?:|data:image)/.test(v)&&v.length<200000; // blob: só vale no navegador de quem gerou
 // só imagem de verdade (retrato enviado); a miniatura vista de cima não serve de retrato
 const u=[npc?.retrato,npc?.imagemPerfil,npc?.imagem].find(v=>ok(v)&&!/#mini|miniatura/i.test(v));if(u)return String(u);
 try{return retratoDoNpc({...(npc||{}),nome:npc?.nome||token?.nome||''});}catch(_){}
 const ini=String(npc?.nome||token?.nome||'?').split(/\s+/).filter(Boolean).slice(0,2).map(p=>p[0]).join('').toUpperCase();
 return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 150"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3a5a"/><stop offset="1" stop-color="#101828"/></linearGradient></defs><rect width="120" height="150" fill="url(#g)"/><circle cx="60" cy="58" r="28" fill="#3a4a6a"/><path d="M14 150c6-34 24-50 46-50s40 16 46 50z" fill="#3a4a6a"/><text x="60" y="140" text-anchor="middle" font-family="Georgia" font-size="22" fill="#c9d6ee">${esc(ini)}</text></svg>`);
}

export function instalarConversas(dep){
 const root=dep.root||document,win=root.defaultView||window;if(win.mesaConversasV147_)return win.mesaConversasV147_;
 const D=p=>dep.doc(dep.db,p);
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const uid=()=>{try{return String(dep.uid?.()||'');}catch(_){return '';}};
 const dims=()=>{try{return ctl()?.dimsAtual?.()||{W:28,H:14};}catch(_){return {W:28,H:14};}};
 const dist=(a,b)=>{const {W,H}=dims();return Math.hypot((a.x-b.x)*W/28,(a.y-b.y)*H/14);};
 const mapaAtual=()=>{try{return String(ctl()?.mapaAtual?.()||'');}catch(_){return '';}};
 const emCombate=()=>{try{return !!ctl()?.emCombate?.();}catch(_){return false;}};
 function ator(){try{const c=ctl(),t=c?.ator?.();return t&&c.controla?.(t)?t:null;}catch(_){return null;}}
 const tokens=()=>{try{return ctl()?.todosTokens?.()||[];}catch(_){return [];}};
 const npcDoToken=id=>{const s=decodeURIComponent(String(id||''));if(!s.startsWith('syncnpc:'))return null;const base=s.slice(8).split('~')[0];
  const real=(dep.npcs?.()||[]).find(n=>String(n.id)===base);if(real)return real;
  // v156: o jogador não lê o banco de NPCs (só o mestre). Monta o NPC pelo que a miniatura mostra; o mestre completa ao processar.
  if(ehMestre())return null;const t=tokens().find(x=>String(x.id)===String(id))||tokens().find(x=>decodeURIComponent(String(x.id))===s);if(!t)return null;
  const com=win.mesaComerciantePorToken_?.(id);return {id:base,nome:String(t.nome||base).replace(/^(NPC|PJ|PM)\s*[·:-]\s*/i,''),imagem:String(t.imagem||''),comerciante:!!com,doTokenV156:true};};
 const limpaNome=s=>String(s||'').replace(/^(NPC|PJ|PM)\s*[·:-]\s*/i,'');
 let estado={},relogio=null,parar=[],assinado='',processados=new Set(),caixa=null,minimizado=false,ocupado=false;
 const dia=()=>{const j=Number(relogio?.jogoMs);return Number.isFinite(j)&&j>0?Math.floor((j+(relogio?.ativo?(Date.now()-Number(relogio.realMs||Date.now()))*Number(relogio.fator||24):0))/86400000):Math.floor(Date.now()/86400000);};
 const conv=(m=mapaAtual())=>{const c=estado?.mapas?.[m];return c&&c.aberta?c:null;};

 const ESTILO=`#cvCaixa{position:fixed;right:16px;bottom:16px;z-index:9994;width:min(600px,calc(100vw - 32px));max-height:min(62vh,560px);display:grid;grid-template-columns:132px 1fr;gap:0;background:#0f1726;border:1px solid #c9a85a;border-radius:14px;box-shadow:0 12px 36px #000c;color:#e8eefc;font:13px 'Segoe UI',Arial,sans-serif;overflow:hidden}
#cvCaixa.min{grid-template-columns:52px 1fr;max-height:60px}#cvCaixa.min .cv-corpo,#cvCaixa.min .cv-rodape{display:none}
#cvCaixa .cv-foto{background:#0a0f1a;border-right:1px solid #2f4664;display:flex;flex-direction:column}
#cvCaixa .cv-foto img{width:100%;aspect-ratio:4/5;object-fit:cover;display:block}#cvCaixa.min .cv-foto img{aspect-ratio:1/1}
#cvCaixa .cv-foto small{padding:5px 6px;color:#c9b48a;font-size:11px;line-height:1.3}
#cvCaixa .cv-lado{display:flex;flex-direction:column;min-width:0;min-height:0}
#cvCaixa header{display:flex;align-items:center;gap:6px;padding:7px 10px;border-bottom:1px solid #2f4664;background:#141e33}
#cvCaixa header b{flex:1;color:#ffe9b8;font-size:14px}#cvCaixa header button{width:26px;height:26px;border-radius:7px;border:1px solid #2f4664;background:#16233a;color:#fff;cursor:pointer;padding:0}
#cvCaixa .cv-corpo{overflow:auto;padding:8px 10px;display:flex;flex-direction:column;gap:5px;min-height:60px}
#cvCaixa .cv-l{line-height:1.4}#cvCaixa .cv-npc{color:#ffe9b8;font-style:italic}#cvCaixa .cv-pj{color:#bfe3ff}#cvCaixa .cv-sis{color:#9fb3cc;font-size:12px}
#cvCaixa .cv-t{border-left:3px solid #57e3a1;padding-left:7px;color:#d8ffe9}#cvCaixa .cv-t.no{border-color:#ff8a7a;color:#ffd6cf}#cvCaixa .cv-t.oc{border-color:#b98aff;color:#e6d8ff}
#cvCaixa .cv-rodape{border-top:1px solid #2f4664;padding:7px 10px;display:flex;flex-direction:column;gap:6px;max-height:46%;overflow:auto}
#cvCaixa .cv-testes{display:flex;flex-wrap:wrap;gap:5px}#cvCaixa .cv-b{min-height:28px;padding:3px 9px;border-radius:9px;border:1px solid #2f4664;background:rgba(255,255,255,.05);color:#e8eefc;cursor:pointer;font:inherit;font-size:12px}
#cvCaixa .cv-b:hover:not(:disabled){border-color:#ffd447}#cvCaixa .cv-b:disabled{opacity:.45;cursor:not-allowed}
#cvCaixa .cv-linha{display:flex;gap:6px}#cvCaixa input[type=text],#cvCaixa textarea{flex:1;min-width:0;background:#0a0f1a;color:#e8eefc;border:1px solid #2f4664;border-radius:8px;padding:5px 7px;font:inherit}
#cvCaixa .cv-sec{border:1px dashed #b98aff;border-radius:9px;padding:6px;color:#e6d8ff;font-size:12px}#cvCaixa .cv-sec textarea{width:100%;box-sizing:border-box;min-height:44px;margin:4px 0}
#cvAviso{position:fixed;left:50%;top:84px;transform:translateX(-50%);z-index:9999;background:#201a0a;border:1px solid #c9a85a;color:#ffe9b8;padding:8px 14px;border-radius:12px;font:600 13px 'Segoe UI',Arial,sans-serif;pointer-events:none}`;
 if(!root.getElementById('cvCss')){const st=root.createElement('style');st.id='cvCss';st.textContent=ESTILO;root.head.append(st);}
 const aviso=t=>{root.getElementById('cvAviso')?.remove();const n=root.createElement('div');n.id='cvAviso';n.textContent=t;root.body.append(n);setTimeout(()=>n.remove(),3200);};

 // ------------------------------------------------------------ clique no NPC (fora de combate)
 const anterior=win.mesaDialogoNPC_;
 win.mesaDialogoNPC_=(id,atorId)=>{
  if(typeof anterior==='function'&&anterior(id,atorId))return true; // Denzel, guardas do portão…
  if(/^syncnpc:comerciante_generico_/.test(decodeURIComponent(String(id)))&&!emCombate())return true; // v161: comerciante genérico abre a loja (mesa-interacoes), nunca o menu de armas
  try{const npc=npcDoToken(id);
   // v152: comerciante/prestador (UR-17, Hessa…): o clique abre a loja (mesa-interacoes); o menu de ataque não abre junto
   if(npc&&(npc.comerciante===true||String(npc.comerciante)==='true'||npc.prestadorServicos===true)&&!/maelia|darek|ilu|ilya|nilo/.test(sem(npc.nome))&&!emCombate()){const a=ator();if(a&&!decodeURIComponent(String(a.id)).startsWith('sync'))return true;}
   if(!npc||!npcUnico(npc))return false;
   if(emCombate())return false;const a=ator(),t=tokens().find(x=>String(x.id)===String(id));if(!a||!t)return false;
   if(decodeURIComponent(String(a.id)).startsWith('sync'))return false;
   const c=conv();if(c&&decodeURIComponent(c.npc?.token||'')===decodeURIComponent(String(id))){minimizado=false;desenhar(true);return true;}
   if(dist(a,t)>ALCANCE){aviso(`🚶 Chegue perto de ${limpaNome(npc.nome)} (uns 3 m) para conversar.`);return true;}
   void pedir('abrir',{token:String(id)});return true;
  }catch(e){console.warn('[Conversas]',e);return false;}
 };

 async function pedir(acao,extra={}){
  const a=ator();if(!a&&!ehMestre())return;
  const cmd={donoUid:uid(),personagemId:a?decodeURIComponent(String(a.id)):'__mestre__',tokenId:a?String(a.id):'',mapa:mapaAtual(),acao,...extra,criadoEm:Date.now()};
  try{if(ehMestre())await processar('local'+Date.now()+Math.random().toString(36).slice(2,5),cmd);else await dep.setDoc(D(PEDIDOS+'/p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)),clean(cmd));}
  catch(e){console.warn('[Conversas] pedido',e);aviso('Não deu: '+(e?.message||e));}
 }

 // ------------------------------------------------------------ mestre: processa pedidos
 async function registrarHist(msg){try{await dep.runTransaction(dep.db,async tx=>{const s=await tx.get(D(HIST)),h=s.exists()?s.data():{entries:[],revision:0};tx.set(D(HIST),clean({entries:[...(h.entries||[]),{id:'cv:'+Date.now().toString(36)+Math.random().toString(36).slice(2,4),ts:Date.now(),actorUid:'',targetUid:'',message:msg}].slice(-120),revision:Number(h.revision||0)+1}));});}catch(_){}}
 async function mudar(mapa,f){
  let res=null;await dep.runTransaction(dep.db,async tx=>{const s=await tx.get(D(ESTADO)),v=s.exists()?s.data():{mapas:{}};const mapas={...(v.mapas||{})};const atual=mapas[mapa]?clean(mapas[mapa]):null;const novo=f(atual);res=novo;mapas[mapa]=novo;tx.set(D(ESTADO),clean({...v,mapas,atualizadoEm:Date.now()}));});return res;
 }
 const linha=(tipo,texto,extra={})=>({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),ts:Date.now(),tipo,texto:String(texto||''),...extra});
 const comLinhas=(c,...ls)=>({...c,linhas:[...(c.linhas||[]),...ls].slice(-MAX_LINHAS)});
 function pertoDe(npcTok,mapa){return tokens().filter(t=>String(t.mapaId||'')===mapa&&!decodeURIComponent(String(t.id)).startsWith('sync')&&dist(t,npcTok)<=VER).map(t=>({id:decodeURIComponent(String(t.id)),nome:limpaNome(t.nome)}));}
 async function processar(pid,cmd){
  if(processados.has(pid))return;processados.add(pid);
  try{
   const mapa=String(cmd.mapa||''),eu=cmd.personagemId==='__mestre__'?null:tokens().find(x=>decodeURIComponent(String(x.id))===String(cmd.personagemId));
   if(cmd.personagemId!=='__mestre__'&&!eu)throw Error('Personagem não está no mapa.');
   const quem=eu?limpaNome(eu.nome):'Mestre';
   if(cmd.acao==='abrir'){
    if(emCombate())throw Error('Em combate não dá para conversar.');
    const t=tokens().find(x=>String(x.id)===String(cmd.token)),npc=npcDoToken(cmd.token);if(!t||!npc)throw Error('NPC não encontrado.');
    if(eu&&dist(eu,t)>ALCANCE+1)throw Error('Longe demais.');
    const nome=limpaNome(npc.nome),abertura=testesDaSessao(nome).find(x=>x.evidente)?.evidente||`${nome} olha para vocês. — Pois não?`;
    await mudar(mapa,c=>{if(c?.aberta&&decodeURIComponent(c.npc?.token||'')===decodeURIComponent(String(cmd.token)))return {...c,participantes:pertoDe(t,mapa)};
     return {id:'cv'+Date.now().toString(36),aberta:true,inicio:Date.now(),npc:{token:String(cmd.token),npcId:String(npc.id),nome,imagem:retratoDe(npc,t),conceito:String(npc.conceito||'')},x:Number(t.x),y:Number(t.y),participantes:pertoDe(t,mapa),tentou:{},
      linhas:[linha('sis',`💬 ${quem} começou uma conversa com ${nome}.`),linha('npc',abertura,{quem:nome})]};});
    await registrarHist(`💬 ${quem} começou uma conversa com ${nome}.`);return;
   }
   const c=conv(mapa)||estado?.mapas?.[mapa];if(!c?.aberta)throw Error('Não há conversa aberta aqui.');
   if(cmd.acao==='encerrar'){await mudar(mapa,x=>x?{...comLinhas(x,linha('sis',`👋 ${quem} encerrou a conversa.`)),aberta:false,fim:Date.now()}:x);await registrarHist(`👋 Fim da conversa com ${c.npc?.nome}.`);return;}
   if(cmd.acao==='falar'){const txt=String(cmd.texto||'').slice(0,400).trim();if(!txt)return;
    const npcFala=cmd.personagemId==='__mestre__'&&cmd.comoNpc;
    await mudar(mapa,x=>comLinhas(x,linha(npcFala?'npc':'pj',txt,{quem:npcFala?c.npc.nome:quem})));
    await registrarHist(npcFala?`🗨️ ${c.npc.nome}: “${txt}”`:`🗨️ ${quem}: “${txt}”`);return;}
   if(cmd.acao==='consequencia'){ // mestre envia a consequência de um teste oculto
    const txt=String(cmd.texto||'').slice(0,600).trim();
    await mudar(mapa,x=>{const pend={...(x.pendentes||{})};const p=pend[cmd.pend];delete pend[cmd.pend];return {...comLinhas(x,linha('oc',txt||'(nada de especial)',{quem:p?.quem||'',teste:p?.titulo||''})),pendentes:pend};});
    try{await dep.deleteDoc(D(PEDIDOS+'/seg_'+cmd.pend));}catch(_){}
    await registrarHist(`🔮 ${c.npc.nome} · ${txt||'(nada de especial)'}`);return;}
   if(cmd.acao==='teste'){
    if(!eu)throw Error('Escolha um personagem.');
    const T=testesDoNpc(c.npc.nome).find(x=>x.id===cmd.teste);if(!T)throw Error('Teste desconhecido.');
    const ja=c.tentou?.[cmd.personagemId]?.[T.id];if(ja===dia())throw Error('Já tentou isso hoje.');
    const P=win.mesaPedagioV138_;const valor=P?Number(await P.pericia(eu,[T.pericia,sem(T.pericia)]))||0:0;
    const ch=chance(valor,T.dif),die=1+Math.floor(Math.random()*100),r=classificarTeste(ch,die);
    const cons=r.grau==='Crítico'?(T.critico||T.sucesso):r.sucesso?T.sucesso:T.falha;
    if(!T.oculto){
     await mudar(mapa,x=>{const tentou={...(x.tentou||{})};tentou[cmd.personagemId]={...(tentou[cmd.personagemId]||{}),[T.id]:dia()};
      return {...comLinhas(x,linha('teste',`${quem} · ${T.titulo} (${T.pericia} ${die}/${ch}) → ${r.grau}`,{ok:r.sucesso}),...(cons?[linha('npc',cons,{quem:c.npc.nome})]:[])),tentou};});
     await registrarHist(`🎲 ${quem} · ${T.titulo} com ${c.npc.nome} (${T.pericia} ${die}/${ch}) → ${r.grau}${cons?' · '+cons:''}`);return;
    }
    // oculto: o dado fica só com o mestre (doc que só o mestre lê); os jogadores veem que o teste foi feito
    const pendId='h'+Date.now().toString(36);
    try{await dep.setDoc(D(PEDIDOS+'/seg_'+pendId),clean({donoUid:uid(),personagemId:'',segredo:{mapa,quem,titulo:T.titulo,pericia:T.pericia,die,chance:ch,grau:r.grau,sugestao:cons||'',em:Date.now()}}));}catch(e){console.warn('[Conversas] segredo',e);}
    segredos.set(pendId,{mapa,quem,titulo:T.titulo,pericia:T.pericia,die,chance:ch,grau:r.grau,sucesso:r.sucesso,sugestao:cons||'',em:Date.now()});
    await mudar(mapa,x=>{const tentou={...(x.tentou||{})};tentou[cmd.personagemId]={...(tentou[cmd.personagemId]||{}),[T.id]:dia()};
     return {...comLinhas(x,linha('sis',`🔮 ${quem} tentou: ${T.titulo} (teste oculto — o mestre vai dizer o que ${quem} percebeu).`)),tentou,pendentes:{...(x.pendentes||{}),[pendId]:{quem,titulo:T.titulo,em:Date.now()}}};});
    await registrarHist(`🔮 ${quem} fez um teste oculto (${T.titulo}) com ${c.npc.nome}.`);
    // sem resposta do mestre em 90 s, vai a consequência preparada (ou uma neutra)
    setTimeout(()=>{const s=segredos.get(pendId);if(!s||s.enviado)return;s.enviado=true;void pedir('consequencia',{pend:pendId,texto:s.sugestao||`${quem} observa ${c.npc.nome} com atenção, mas não tira nada de claro agora.`,mapa});},win.mesaAutomaticaV181_?.ligada?.()?4000:90000); // v181: mesa automática responde logo
    desenhar(true);return;
   }
  }catch(e){console.warn('[Conversas]',e?.message||e);if(cmd.personagemId!=='__mestre__')try{await mudarAviso(cmd,e?.message||String(e));}catch(_){}else aviso(e?.message||String(e));}
  finally{if(!String(pid).startsWith('local'))try{await dep.deleteDoc(D(PEDIDOS+'/'+pid));}catch(_){}}
 }
 // erro para o jogador que pediu: vai como linha de sistema só se houver conversa; senão, some
 async function mudarAviso(cmd,msg){const m=String(cmd.mapa||'');if(!estado?.mapas?.[m]?.aberta)return;await mudar(m,x=>comLinhas(x,linha('sis',`⚠️ ${msg}`,{para:cmd.personagemId})));}
 const segredos=new Map();

 // ------------------------------------------------------------ caixa de conversa (todos)
 function souParticipante(c){
  if(ehMestre())return true;
  const a=ator();if(!a)return false;const id=decodeURIComponent(String(a.id));
  if((c.participantes||[]).some(p=>p.id===id))return true;
  const t=tokens().find(x=>String(x.id)===String(c.npc?.token));return !!t&&String(a.mapaId||mapaAtual())===mapaAtual()&&dist(a,t)<=VER;
 }
 function desenhar(forcar=false){
  const c=conv();
  if(!c||!souParticipante(c)||emCombate()){if(c&&emCombate()&&ehMestre()&&!ocupado){ocupado=true;void pedir('encerrar').finally(()=>{ocupado=false;});}caixa?.remove();caixa=null;return;}
  if(!caixa){caixa=root.createElement('div');caixa.id='cvCaixa';caixa.setAttribute('role','dialog');root.body.append(caixa);caixa.addEventListener('pointerdown',e=>e.stopPropagation());caixa.addEventListener('click',aoClicar);caixa.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'&&e.target.matches('input[data-fala]')){e.preventDefault();enviarFala(e.target);}});}
  caixa.classList.toggle('min',minimizado);
  const a=ator(),meu=a?decodeURIComponent(String(a.id)):'',testes=testesDoNpc(c.npc?.nome||'');
  const linhas=(c.linhas||[]).filter(l=>!l.para||l.para===meu||ehMestre()).map(l=>l.tipo==='npc'?`<div class="cv-l cv-npc"><b>${esc(l.quem||c.npc.nome)}:</b> ${esc(l.texto)}</div>`:l.tipo==='pj'?`<div class="cv-l cv-pj"><b>${esc(l.quem)}:</b> ${esc(l.texto)}</div>`:l.tipo==='teste'?`<div class="cv-l cv-t ${l.ok?'':'no'}">🎲 ${esc(l.texto)}</div>`:l.tipo==='oc'?`<div class="cv-l cv-t oc">🔮 ${l.quem?`<b>${esc(l.quem)}</b> percebe: `:''}${esc(l.texto)}</div>`:`<div class="cv-l cv-sis">${esc(l.texto)}</div>`).join('');
  let rod='';
  if(!minimizado){
   if(a&&!ehMestre()){const ja=c.tentou?.[meu]||{};
    rod+=`<div class="cv-testes">${testes.map(t=>`<button type="button" class="cv-b" data-teste="${esc(t.id)}" ${ja[t.id]===dia()?'disabled':''} title="${esc(t.pericia)}${t.oculto?' · teste oculto: o mestre vê o dado, você recebe a consequência':''} · uma vez por dia">${t.oculto?'🔮':'🎲'} ${esc(t.titulo)}</button>`).join('')}</div>
     <div class="cv-linha"><input type="text" data-fala maxlength="400" placeholder="Dizer algo para ${esc(c.npc.nome)}…"><button type="button" class="cv-b" data-falar>🗣️ Dizer</button></div>`;}
   if(ehMestre()){
    const sec=[...segredos.entries()].filter(([k,s])=>!s.enviado&&s.mapa===mapaAtual());
    rod+=sec.map(([k,s])=>`<div class="cv-sec">🔮 <b>${esc(s.quem)}</b> · ${esc(s.titulo)} (${esc(s.pericia)} <b>${s.die}/${s.chance}</b> → <b>${esc(s.grau)}</b>) — só você vê o dado.<textarea data-cons="${k}">${esc(s.sugestao||'')}</textarea><button type="button" class="cv-b" data-enviar="${k}">📨 Enviar a consequência para o grupo</button></div>`).join('');
    rod+=`<div class="cv-linha"><input type="text" data-fala data-npc maxlength="400" placeholder="Fala de ${esc(c.npc.nome)}…"><button type="button" class="cv-b" data-falar data-npc>🗨️ ${esc(c.npc.nome.split(' ')[0])} diz</button></div>
     <div class="cv-linha"><input type="text" data-narra maxlength="400" placeholder="Narrar (aparece como sistema)…"><button type="button" class="cv-b" data-narrar>📜 Narrar</button></div>`;}
  }
  const foto=c.npc.imagem;
  const h=`<div class="cv-foto"><img src="${esc(foto)}" alt="${esc(c.npc.nome)}">${minimizado?'':`<small>${esc(c.npc.conceito||'')}</small>`}</div>
<div class="cv-lado"><header><b>💬 ${esc(c.npc.nome)}</b><button type="button" data-min title="${minimizado?'Abrir':'Recolher'}">${minimizado?'▴':'▾'}</button><button type="button" data-fim title="Encerrar a conversa (para todos)">✕</button></header>
<div class="cv-corpo">${linhas}</div>${rod?`<div class="cv-rodape">${rod}</div>`:''}</div>`;
  if(forcar||caixa.dataset.h!==h){
   const foco=root.activeElement&&caixa.contains(root.activeElement)?{sel:root.activeElement.matches('[data-npc]')?'input[data-fala][data-npc]':root.activeElement.matches('[data-narra]')?'input[data-narra]':root.activeElement.matches('input[data-fala]')?'input[data-fala]':null,val:root.activeElement.value}:null;
   const rascunhos={};caixa.querySelectorAll('textarea[data-cons]').forEach(t=>rascunhos[t.dataset.cons]=t.value);
   caixa.innerHTML=h;caixa.dataset.h=h;
   for(const [k,v] of Object.entries(rascunhos)){const t=caixa.querySelector(`textarea[data-cons="${k}"]`);if(t)t.value=v;}
   if(foco?.sel){const i=caixa.querySelector(foco.sel);if(i){i.value=foco.val||'';i.focus();}}
   const corpo=caixa.querySelector('.cv-corpo');if(corpo)corpo.scrollTop=corpo.scrollHeight;
  }
 }
 function enviarFala(inp){const v=String(inp.value||'').trim();if(!v)return;inp.value='';void pedir('falar',{texto:v,comoNpc:inp.matches('[data-npc]')});}
 function aoClicar(ev){
  const b=ev.target.closest('button');if(!b)return;
  if(b.dataset.min!==undefined){minimizado=!minimizado;desenhar(true);return;}
  if(b.dataset.fim!==undefined){void pedir('encerrar');return;}
  if(b.dataset.teste){b.disabled=true;void pedir('teste',{teste:b.dataset.teste});return;}
  if(b.dataset.falar!==undefined){const i=caixa.querySelector(b.dataset.npc!==undefined?'input[data-fala][data-npc]':'input[data-fala]:not([data-npc])');if(i)enviarFala(i);return;}
  if(b.dataset.narrar!==undefined){const i=caixa.querySelector('input[data-narra]');const v=String(i?.value||'').trim();if(!v)return;i.value='';void (async()=>{const m=mapaAtual();await mudar(m,x=>comLinhas(x,linha('sis',v)));await registrarHist('📜 '+v);})();return;}
  if(b.dataset.enviar){const k=b.dataset.enviar,s=segredos.get(k);if(!s||s.enviado)return;s.enviado=true;const t=caixa.querySelector(`textarea[data-cons="${k}"]`);void pedir('consequencia',{pend:k,texto:String(t?.value||s.sugestao||'')});desenhar(true);}
 }

 // ------------------------------------------------------------ assinaturas
 function assinar(){
  parar.forEach(f=>{try{f();}catch(_){}});parar=[];
  parar.push(dep.onSnapshot(D(ESTADO),s=>{estado=s.exists()?s.data():{};desenhar();},()=>{}));
  parar.push(dep.onSnapshot(D('combatesAtivos/mesaRelogio'),s=>{relogio=s.exists()?s.data():null;},()=>{}));
  if(ehMestre())parar.push(dep.onSnapshot(dep.collection(dep.db,...PEDIDOS.split('/')),q=>{q.forEach(d=>{const v=d.data()||{};if(String(d.id).startsWith('seg_')){const k=String(d.id).slice(4);if(!segredos.has(k)&&v.segredo&&Date.now()-Number(v.segredo.em||0)<6*3600e3)segredos.set(k,{...v.segredo,enviado:!estado?.mapas?.[v.segredo.mapa]?.pendentes?.[k]});return;}void processar(d.id,v);});},()=>{}));
 }
 const vigia=setInterval(()=>{try{const k=uid()+'|'+ehMestre();if(!uid())return;if(k!==assinado){assinado=k;assinar();}desenhar();}catch(e){console.warn('[Conversas]',e);}},700);
 win.mesaConversasV147_={testesDoNpc,abrirComo:(token)=>pedir('abrir',{token}),parar:()=>{clearInterval(vigia);parar.forEach(f=>{try{f();}catch(_){}});}};
 return win.mesaConversasV147_;
}
