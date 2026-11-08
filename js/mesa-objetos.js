import {miniaturaDeItem} from './mesa-itens-mini.js?v=194';
// Mesa Estelar v124 — Ambiente interativo no mapa.
//
// Portas, escotilhas, gavetas, armários e cofres abrem e fecham; lâmpadas, computadores,
// terminais e máquinas ligam e desligam. O que estiver trancado (ou travado) pede um teste
// de perícia do personagem que está perto:
//   • portas e recipientes: Segurança [Cofres e Fechaduras], Mecanismos ou Força Bruta
//     (Força Bruta abre, mas deixa arrombado e faz barulho quando falha);
//   • máquinas e terminais: Computação, Cibersegurança, Eletrônica ou Mecânica;
//   • luzes: Eletrônica ou Mecânica.
// Uma tentativa por perícia, por personagem, em cada objeto (o mestre pode zerar).
// Porta fechada bloqueia a passagem; aberta, libera. Luz acesa ilumina em volta.
//
// Fluxo: o jogador clica no ícone do objeto (precisa estar a até 2 m), escolhe a ação e,
// se precisar, rola a perícia. O pedido vai para a fila de ações e o navegador do mestre
// aplica na cena e escreve no histórico. O mestre também tranca, destranca, muda o tipo, a
// dificuldade e o que há dentro de cada objeto.
// v125: armários, baús e gavetas guardam ITENS e BILHETES (grade de quadradinhos ao abrir);
// itens e bilhetes também podem ficar soltos no chão. O jogador lê sem levar, ou pega e guarda
// na mochila (e lê depois no inventário). Arma derrubada (efeito 🫳 Desarmar) cai no chão e
// pegar de volta gasta tempo: 1 ação no combate por turnos, ~1,5 ação no tempo real.
// Módulo à parte: se falhar, o mapa segue igual.

const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const clean=v=>JSON.parse(JSON.stringify(v??null));
const SCENE='combatesAtivos/mapaMesaSyncDiretaCena',MAP='combatesAtivos/mapaMesaSyncDireta',HIST='combatesAtivos/mapaMesaSyncHistorico',HEALTH='combatesAtivos/mapaMesaSyncSaude';
export const ACOES='combatesAtivos/mesaObjetos/acoes';
export const ALCANCE_M=2;

export const TIPOS={
 porta:{icone:'🚪',nome:'Porta',abre:true,pericias:['Segurança [Cofres e Fechaduras]','Mecanismos','Força Bruta']},
 recipiente:{icone:'🗄️',nome:'Gaveta / armário',abre:true,pericias:['Segurança [Cofres e Fechaduras]','Mecanismos','Força Bruta']},
 luz:{icone:'💡',nome:'Luz',abre:false,pericias:['Eletrônica','Mecânica']},
 maquina:{icone:'💻',nome:'Máquina / computador',abre:false,pericias:['Computação','Cibersegurança','Eletrônica','Mecânica']},
 descanso:{icone:'🛏️',nome:'Cama / cápsula de descanso',abre:false,repouso:'sono',pericias:[]},
 recuperacao:{icone:'🩺',nome:'Cápsula de recuperação (hospital)',abre:false,repouso:'cura',pericias:[]},
 assento:{icone:'🪑',nome:'Cadeira / banco (sentar)',abre:false,repouso:'sentado',pericias:[]} // v139
};
export const NOTA_IMG='data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><path d="M8 4h19l6 6v26H8z" fill="#efe3c2" stroke="#7a6a48" stroke-width="1.5"/><path d="M27 4v6h6" fill="#d8c79c" stroke="#7a6a48" stroke-width="1.5"/><g stroke="#8a7a58" stroke-width="1.4"><path d="M12 15h16M12 19h16M12 23h13M12 27h15"/></g></svg>');
export const ARMA_IMG='data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30"><path d="M4 12h34l6-4h10v8H44l-2 3H30l-3 8h-8l3-8H4z" fill="#4a5058" stroke="#1d2126" stroke-width="1.5"/><path d="M38 12h16" stroke="#7fd6ff" stroke-width="1.5"/></svg>');
// Itens guardados num armário/baú/gaveta.
export function itensDentro(o){return Array.isArray(o?.estadoInterativo?.itens)?o.estadoInterativo.itens:[];}
// Item solto no chão (inclui itens do banco colocados pelo catálogo e armas derrubadas).
export function itemSolto(o){
 if(o?.itemSolto)return {...o.itemSolto,uid:String(o.itemSolto.uid||o.id)};
 if(String(o?.tipo||'')==='item')return {uid:String(o.id),tipo:'item',idBanco:String(o.modeloId||o.idBanco||'').split(':').pop(),nome:String(o.nome||'Item'),imagem:String(o.imagem||'')};
 return null;
}
export const novoUid=()=>'it_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
export const DIFICULDADES=[['muito_facil','Muito fácil',2],['facil','Fácil',1.5],['padrao','Padrão',1],['dificil','Difícil',2/3],['formidavel','Formidável',1/2],['herculeo','Hercúleo',1/10]];
export const valorComDificuldade=(v,d)=>Math.max(0,Math.round((Number(v)||0)*((DIFICULDADES.find(x=>x[0]===d)||DIFICULDADES[2])[2])));

// Tipo do objeto pelo campo "interativo" (definido pelo mestre) ou pelo nome.
export function tipoInterativo(o){
 if(!o)return '';const fix=String(o.interativo||'');if(fix==='nenhum')return '';if(TIPOS[fix])return fix;
 const n=sem(o.nome);
 if(/\b(parede|muro|piso|chao|rua|faixa|tapete|canteiro|corda|cano|grade de esgoto|escada|escadaria|corredor|patamar|guarda-corpo|ladrilhos?|placas de metal)\b/.test(n))return '';
 if(/\b(porta|portao|portas|escotilha|comporta|alcapao|portinhola|eclusa)\b/.test(n))return 'porta';
 if(/(capsula (de )?(recuperacao|medica|regenera)|tanque de (cura|regenera)|leito hospitalar|maca de regenera|camara de cura|maca flutuante|mesa cirurgica|capsula criogenica)/.test(n))return 'recuperacao';
 if(/(\bcama\b|beliche|capsula de (descanso|aluguel|dormir)|saco de dormir|rede de dormir|\bcatre\b|dormitorio)/.test(n))return 'descanso';
 if(/(\bcadeira|banqueta|\bbanco\b|poltrona|\bsofa\b|assento|banquinho|\bdiva\b|banco da plateia)/.test(n)&&!/banco de (dados|areia)/.test(n))return 'assento'; // v139: sentar descansa
 if(/(gaveta|armario|comoda|cofre|\bbau\b|arquivo|geladeira|guarda.?roupa|cristaleira|criado.?mudo|caixa.?forte|armarinho|lockers?|escrivaninha)/.test(n))return 'recipiente';
 if(/(lampada|luminaria|abajur|lustre|\bluz\b|lanterna|poste|holofote|refletor|candeeiro|braseiro|neon)/.test(n))return 'luz';
 if(/(computador|terminal|console|painel de controle|maquina|gerador|\btela\b|monitor|\bradio\b|radiola|televisor|mainframe|servidor|motor|elevador|reator|projetor|maquinario)/.test(n))return 'maquina';
 return '';
}
// Estado com os padrões de cada tipo. Porta sem bloqueio no mapa começa aberta.
export function estadoDe(o){
 const t=tipoInterativo(o),e=o?.estadoInterativo||{};
 return {aberto:e.aberto??(t==='porta'?!o?.bloqueiaMovimento:false),ligado:!!e.ligado,trancado:!!e.trancado,quebrado:!!e.quebrado,
  dificuldade:e.dificuldade||'padrao',tentativas:e.tentativas||{},conteudo:String(e.conteudo||''),itens:Array.isArray(e.itens)?e.itens:[],orig:e.orig||null};
}
export function descreverEstado(o){
 const t=tipoInterativo(o),e=estadoDe(o);if(!t)return '';
 if(TIPOS[t].repouso){const oc=globalThis.mesaRepouso?.ocupantes?.(o.id)||[];return oc.length?(TIPOS[t].repouso==='cura'?'🩺 ocupada':TIPOS[t].repouso==='sentado'?'🪑 alguém sentado':'😴 alguém dormindo'):'livre';}
 const f=/a$|ã$|ão$|eira$|tela$|luz$|porta$|gaveta$|escotilha$/i.test(String(o.nome||'').trim().split(/\s+/)[0]);// feminino aproximado
 const base=TIPOS[t].abre?(e.aberto?(f?'aberta':'aberto'):(f?'fechada':'fechado')):(e.ligado?(f?'ligada':'ligado'):(f?'desligada':'desligado'));
 return base+(e.trancado?(TIPOS[t].abre?' · 🔒 '+(f?'trancada':'trancado'):' · 🔒 '+(f?'travada':'travado')):'')+(e.quebrado?' · 💥 arrombad'+(f?'a':'o'):'');
}
// Aplica um pedido ao objeto: devolve {objeto novo, mensagem} ou lança erro.
export function aplicarPedido(o,cmd){
 if(cmd.acao==='quebrar'){ // v135: ferramenta (machado/picareta) + Força Bruta
  const quem=String(cmd.nome||'Alguém'),nome=String(o.nome||'objeto'),r=`Força Bruta ${cmd.teste?.die}/${cmd.teste?.valor} · ${cmd.teste?.grau}`;
  if(o.destruido)throw Error(nome+' já está destruído.');
  if(!cmd.teste?.sucesso)return {objeto:{...o},msg:`${cmd.icone||'🪓'} ${quem} tentou ${String(cmd.verbo||'quebrar').toLowerCase()} ${nome} e não conseguiu (${r})`};
  const novo={...o,pvAtual:0,destruido:true,bloqueiosOriginais:{movimento:!!o.bloqueiaMovimento,visao:!!o.bloqueiaVisao},bloqueiaMovimento:false,bloqueiaVisao:false,pegandoFogo:false,estadoFogo:{}};
  return {objeto:novo,msg:`${cmd.icone||'🪓'} ${quem} ${cmd.verbo==='Cortar'?'cortou':'quebrou'} ${nome} com ${cmd.ferramenta||'a ferramenta'} (${r})`};
 }
 const t=tipoInterativo(o);if(!t&&cmd.acao!=='mestre')throw Error('Este objeto não é interativo.');
 const e=estadoDe(o),T=TIPOS[t]||{},quem=String(cmd.nome||'Alguém'),nome=String(o.nome||'objeto');let msg='';
 const novo={...o};
 if(cmd.acao==='mestre'){
  if(cmd.objeto&&'interativo' in cmd.objeto)novo.interativo=String(cmd.objeto.interativo||'');
  Object.assign(e,cmd.patch||{});
  if(cmd.patch?.trancado&&T.abre)e.aberto=false;
  if(cmd.patch?.zerar)e.tentativas={};delete e.zerar;
 }else if(cmd.acao==='alternar'){
  if(T.abre){if(e.trancado&&!e.aberto)throw Error(nome+' está trancad'+(/a$/i.test(nome.split(' ')[0])?'a':'o')+'.');e.aberto=!e.aberto;msg=`${T.icone} ${quem} ${e.aberto?'abriu':'fechou'}: ${nome}`;}
  else{if(e.trancado&&!e.ligado)throw Error(nome+' não responde: precisa de um teste.');e.ligado=!e.ligado;msg=`${T.icone} ${quem} ${e.ligado?'ligou':'desligou'}: ${nome}`;}
 }else if(cmd.acao==='teste'){
  const k=String(cmd.personagemId||''),p=String(cmd.teste?.pericia||'');
  if(!p)throw Error('Teste sem perícia.');
  if(e.tentativas?.[k]?.[p])throw Error('Já tentou '+p+' aqui.');
  e.tentativas={...e.tentativas,[k]:{...(e.tentativas?.[k]||{}),[p]:String(cmd.teste.grau||'')}};
  const r=`${p} ${cmd.teste.die}/${cmd.teste.valor} · ${cmd.teste.grau}`;
  if(cmd.teste.sucesso){
   e.trancado=false;
   if(T.abre){e.aberto=true;if(/for[cç]a bruta/i.test(p))e.quebrado=true;msg=`${T.icone} ${quem} ${/for[cç]a bruta/i.test(p)?'arrombou':'destrancou e abriu'}: ${nome} (${r})`;}
   else{e.ligado=true;msg=`${T.icone} ${quem} fez funcionar: ${nome} (${r})`;}
  }else msg=`${T.icone} ${quem} falhou em ${nome} (${r})${/for[cç]a bruta/i.test(p)?' · fez barulho!':''}`;
 }else if(cmd.acao==='chave'){
  if(!cmd.chaveNome)throw Error('Sem a chave de '+nome+'.');
  e.trancado=false;if(T.abre)e.aberto=true;else e.ligado=true;msg=`🔑 ${quem} usou ${cmd.chaveNome}: ${nome} ${T.abre?'destrancada e aberta':'liberada'}`;
 }else if(cmd.acao==='pegar'){
  if(!T.abre||!e.aberto)throw Error(nome+' está fechad'+(/a$/i.test(nome.split(' ')[0])?'a':'o')+'.');
  const k=e.itens.findIndex(x=>String(x.uid)===String(cmd.uid));if(k<0)throw Error('Este item não está mais aí.');
  const it=e.itens[k];e.itens=e.itens.filter((_,i)=>i!==k);msg=`✋ ${quem} pegou ${it.tipo==='nota'?'📜 ':''}${it.nome||'um item'} (${nome})`;
 }else throw Error('Pedido desconhecido.');
 // porta: fechada bloqueia; aberta libera (guarda como era antes)
 if(tipoInterativo(novo)==='porta'){
  if(!e.orig)e.orig={bloq:!!o.bloqueiaMovimento,camada:Number(o.camada)||3,visao:o.bloqueiaVisao??null};
  if(e.aberto){novo.bloqueiaMovimento=false;novo.bloqueiaVisao=false;novo.camada=e.orig.bloq?1:e.orig.camada;}
  else{novo.bloqueiaMovimento=true;novo.bloqueiaVisao=true;novo.camada=3;}
 }
 novo.estadoInterativo=clean(e);
 return {objeto:novo,msg};
}
// v134: // Uma chave serve na porta? (pelo campo "abre" ou pelo nome: "Chave da cápsula 3" × "Porta da cápsula 3")
export function chaveServe(item,o){
 const n=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 const alvo=n(o?.nome),abre=n(item?.abre);if(abre&&(abre===alvo||abre===n(o?.id)))return true;
 const nome=n(item?.nome||item?.name);if(!/^(chave|cartao chave|cartao)\b/.test(nome))return false;
 const resto=nome.replace(/^(cartao chave|chave|cartao)\s*/,'').replace(/^(da|do|de)\s+/,''),r2=alvo.replace(/^(porta|portao|escotilha|comporta|armario|bau|cofre|gaveta)\s*/,'').replace(/^(da|do|de)\s+/,'');
 return !!resto&&resto===r2;
}
// v135: ferramenta certa para o material (machado corta madeira; picareta quebra pedra).
export function ferramentaPara(o,fer={}){
 const m=sem([o?.material,o?.nome,o?.modeloId].join(' '));
 if(fer.machado&&/madeir|wood|arvore|tronco|tabua|caixote|barril|\bbau\b|cerca|palha|estandarte|mesa|cadeira|porta de madeira/.test(m))return {id:'machado',icone:'🪓',verbo:'Cortar',nome:'machado'};
 if(fer.picareta&&/pedra|rocha|rochedo|cristal|concreto|minerio|tijolo|muro|gelo|cascalho|desmoronamento|entulho/.test(m))return {id:'picareta',icone:'⛏️',verbo:'Quebrar',nome:'picareta'};
 return null;
}
// Distância (m) da borda do objeto até a borda da miniatura.
export function distanciaObjeto(t,o,W=28,H=14){
 const dx=(Number(t.x)-Number(o.x))*W/28,dy=(Number(t.y)-Number(o.y))*H/14;
 return Math.max(0,Math.hypot(dx,dy)-Math.max(Number(o.larguraM)||1,Number(o.alturaM)||1)/2-(Number(t.diametroM)||1)/2);
}

const ESTILO=`
#moCamada{position:absolute;inset:0;pointer-events:none;z-index:12}
#moCamada .mo-ic{position:absolute;transform:translate(-50%,-50%);width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-size:13px;line-height:1;background:rgba(10,18,32,.78);border:1.5px solid #8ee7ff;pointer-events:auto;cursor:pointer;opacity:.82;padding:0;color:#fff}
#moCamada .mo-ic:hover{opacity:1;transform:translate(-50%,-50%) scale(1.15)}
#moCamada .mo-ic.mo-tranc{border-color:#ffb347}
#moCamada .mo-ic.mo-tranc::after{content:'🔒';position:absolute;right:-7px;top:-8px;font-size:10px}
#moCamada .mo-ic.mo-on{border-color:#ffe066;box-shadow:0 0 10px rgba(255,224,102,.8)}
#moCamada .mo-ic.mo-cfg{opacity:.45;border-style:dashed;border-color:#9fb3cc;font-size:11px}
#moCamada .mo-luz{position:absolute;transform:translate(-50%,-50%);border-radius:50%;pointer-events:none;background:radial-gradient(circle,rgba(255,236,160,.42) 0%,rgba(255,220,120,.18) 40%,rgba(255,210,100,0) 70%);mix-blend-mode:screen}
#moTodos{position:absolute;left:8px;top:8px;z-index:31;height:28px;border-radius:999px;border:1px solid #3b5878;background:rgba(9,15,29,.85);color:#c6d3e6;font:12px 'Segoe UI',Arial,sans-serif;cursor:pointer;padding:0 10px}
#moTodos[aria-pressed="true"]{border-color:#8ee7ff;color:#fff}
#moBalao{position:absolute;z-index:9001;width:min(300px,calc(100vw - 24px));max-height:72vh;overflow:auto;padding:10px 12px;border-radius:12px;background:rgba(9,15,29,.97);border:1px solid #8ee7ff;color:#e8eefc;font:13px 'Segoe UI',Arial,sans-serif;box-shadow:0 10px 28px rgba(0,0,0,.55)}
#moBalao[hidden]{display:none}
#moBalao h4{margin:0 0 4px;display:flex;gap:6px;align-items:center;font-size:14px;color:#8ee7ff}
#moBalao h4 span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#moBalao h4 button{width:24px;height:24px;border-radius:7px;border:1px solid #3b5878;background:#16233a;color:#fff;cursor:pointer;padding:0}
#moBalao .mo-st{color:#c6d3e6;margin-bottom:6px}
#moBalao .mo-bts{display:flex;flex-direction:column;gap:5px}
#moBalao .mo-b{display:flex;justify-content:space-between;gap:8px;align-items:center;min-height:32px;padding:4px 10px;border-radius:9px;border:1px solid #2f4664;background:rgba(255,255,255,.05);color:#e8eefc;cursor:pointer;font:inherit;text-align:left}
#moBalao .mo-b:hover:not(:disabled){border-color:#8ee7ff}
#moBalao .mo-b:disabled{opacity:.45;cursor:not-allowed}
#moBalao .mo-b em{font-style:normal;color:#ffd447;font-weight:700}
#moBalao .mo-aviso{color:#ffcf8a;font-size:12px;margin:4px 0}
#moBalao .mo-res{margin-top:6px;padding:6px 8px;border-radius:8px;background:rgba(142,231,255,.08);color:#d9f6ff;font-size:12px}
#moBalao .mo-res:empty{display:none}
#moBalao .mo-dentro{margin:6px 0;padding:6px 8px;border-radius:8px;background:rgba(255,212,71,.08);color:#ffe9a8;font-size:12px;white-space:pre-wrap}
#moBalao .mo-mestre{margin-top:8px;padding-top:8px;border-top:1px solid #22385a;display:grid;gap:6px}
#moBalao .mo-mestre label{display:flex;gap:6px;align-items:center;justify-content:space-between;font-size:12px;color:#9fb3cc}
#moBalao select,#moBalao textarea{background:#0b1322;color:#e8eefc;border:1px solid #3b5878;border-radius:8px;font:12px 'Segoe UI',Arial,sans-serif}
#moBalao select{height:30px!important;padding:0 6px!important;font-size:12px!important;min-width:150px;width:auto!important;margin:0!important}
#moCamada .mo-ic.mo-disc{width:9px;height:9px;font-size:0;border-width:1px;border-color:rgba(255,224,102,.55);background:rgba(255,224,102,.35);box-shadow:none;opacity:.5}
#moCamada .mo-ic.mo-disc::after{content:none}
#moCamada .mo-ic.mo-disc:hover{width:24px;height:24px;font-size:13px;opacity:1;background:rgba(10,18,32,.85);transform:translate(-50%,-50%)}
#moCamada .mo-ic.mo-item{width:22px;height:22px;font-size:12px;border-color:#ffd447;background:rgba(40,30,8,.82)}
#moSoltar{position:absolute;left:150px;top:8px;z-index:31;height:28px;border-radius:999px;border:1px solid #3b5878;background:rgba(9,15,29,.85);color:#c6d3e6;font:12px 'Segoe UI',Arial,sans-serif;cursor:pointer;padding:0 10px}
#moSoltar[aria-pressed="true"]{border-color:#ffd447;color:#fff}
#novaSyncBoard.mo-colocando{cursor:copy!important}
#moBalao .mo-grade{display:grid;grid-template-columns:repeat(auto-fill,minmax(46px,1fr));gap:5px;margin:6px 0}
#moBalao .mo-sq{position:relative;aspect-ratio:1;border-radius:8px;border:1px solid #3b5878;background:#0b1322;display:grid;place-items:center;cursor:pointer;padding:2px;font-size:20px;color:#fff}
#moBalao .mo-sq img{max-width:100%;max-height:100%;object-fit:contain}
#moBalao .mo-sq[aria-pressed="true"]{border-color:#ffd447;box-shadow:0 0 0 1px #ffd447 inset}
#moBalao .mo-sq .mo-x{position:absolute;right:-5px;top:-6px;width:16px;height:16px;border-radius:50%;border:0;background:#a8361b;color:#fff;font-size:10px;line-height:16px;padding:0;cursor:pointer}
#moBalao .mo-vazio{grid-column:1/-1;color:#9fb3cc;font-size:12px}
#moBalao .mo-det{margin:4px 0;padding:6px 8px;border-radius:8px;background:rgba(255,255,255,.05)}
#moBalao .mo-det b{color:#ffd447}
#moBalao .mo-det p{margin:3px 0;color:#c6d3e6;font-size:12px;white-space:pre-wrap;max-height:160px;overflow:auto}
#moBalao .mo-nota{background:#efe3c2;color:#2a2214;font:13px Georgia,serif;padding:8px 10px;border-radius:6px;white-space:pre-wrap;max-height:200px;overflow:auto}
#moBalao input[type=text],#moBalao input[type=search]{width:100%;box-sizing:border-box;height:28px;background:#0b1322;color:#e8eefc;border:1px solid #3b5878;border-radius:8px;padding:0 6px;font:12px 'Segoe UI',Arial,sans-serif}
#moBalao textarea{width:100%;box-sizing:border-box;min-height:44px;padding:5px}
`;

export function instalarObjetos(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const rF=p=>{try{return globalThis.mesaTreinoRotaV205?.(p)||p;}catch(_){return p;}}; // v205: durante um duelo de treino a ficha do personagem é a CÓPIA da sessão (treinoSessoes/…), nunca a ficha real
 const D=p=>dep.doc(dep.db,rF(p));
 const el=id=>root.getElementById(id);
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const uid=()=>{try{return String(dep.uid?.()||'');}catch(_){return '';}};
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 const api=()=>{try{return dep.api?.()||null;}catch(_){return null;}};
 const rt=()=>{try{return win.mesaTempoRealV111||null;}catch(_){return null;}};
 if(!el('moCssV192')){const st=root.createElement('style');st.id='moCssV192';st.textContent=`#novaSyncBoard [data-scene-object]{transition:translate .5s cubic-bezier(.4,0,.2,1),opacity .4s ease}
#moCamada .mo-item{width:32px;height:32px;border-color:#ffd447;background:rgba(10,18,32,.92);box-shadow:0 0 9px rgba(255,212,71,.6);opacity:1;animation:moBrilho 2.2s ease-in-out infinite}
#moCamada .mo-item img{width:24px;height:24px;object-fit:contain;pointer-events:none}
#moCamada .mo-item:hover{transform:translate(-50%,-50%) scale(1.18)}
@keyframes moBrilho{50%{box-shadow:0 0 15px rgba(255,212,71,.95)}}
#moToast{position:fixed;left:50%;bottom:76px;transform:translate(-50%,12px);z-index:10070;max-width:min(90vw,460px);padding:8px 14px;border-radius:12px;background:rgba(10,18,32,.96);border:1px solid #6b83a8;color:#e8eefc;font:600 13px 'Segoe UI',Arial,sans-serif;opacity:0;pointer-events:none;transition:opacity .2s,transform .2s}
#moToast.on{opacity:1;transform:translate(-50%,0)}
@media(prefers-reduced-motion:reduce){#moCamada .mo-item{animation:none}#novaSyncBoard [data-scene-object]{transition:none}}`;root.head.append(st);}
 if(!el('moCssV124')){const st=root.createElement('style');st.id='moCssV124';st.textContent=ESTILO;root.head.append(st);}
 // v209: realismo no mapa — item no chão é só a imagem dele (sem brilho/aura), e objeto interativo
 // vira uma ação contextual (pílula) que só aparece quando o personagem está perto.
 if(!el('moCssV209')){const st=root.createElement('style');st.id='moCssV209';st.textContent=`#moCamada .mo-item{width:auto;height:auto;border:0;background:transparent;box-shadow:none;opacity:1;animation:none;padding:0}
#moCamada .mo-item img{width:26px;height:26px;object-fit:contain;filter:drop-shadow(0 2px 2px rgba(0,0,0,.6));pointer-events:none}
#moCamada .mo-item:hover{transform:translate(-50%,-50%) scale(1.15)}
#moCamada .mo-vizinho{position:absolute;transform:translate(-50%,calc(-100% - 12px));display:flex;gap:5px;align-items:center;padding:3px 9px;border-radius:999px;background:rgba(9,15,29,.9);border:1px solid #3b5878;color:#e8eefc;font:600 11px 'Segoe UI',Arial,sans-serif;pointer-events:auto;cursor:pointer;white-space:nowrap;opacity:.95}
#moCamada .mo-vizinho:hover{border-color:#8ee7ff;background:rgba(14,24,42,.95)}
/* v205: passeio limpo — a ação existe (clicar no objeto, F, controle) mas a pílula não fica desenhada */
#moCamada .mo-vizinho.mo-quieto{opacity:0!important;pointer-events:none!important;transform:none!important;padding:0;border:0;width:1px;height:1px;min-width:0;overflow:hidden}
@media(prefers-reduced-motion:reduce){#moCamada .mo-item{animation:none}}`;root.head.append(st);}
 let cena=null,mapa=null,saude=null,parar=[],balao=null,abertoId='',todos=false,chave='',resultado='',assinado=null;
 let selItem='',lendo='',colocando=null,soltarAberto=false,buscaItem='',formAberto=false;
 const processados=new Set(),armasFeitas=new Set();
 const board=()=>el('novaSyncBoard');
 // v158: vale o mapa que ESTA tela mostra. Se o mestre estiver em outro mapa, usa a cena do mapa do jogador
 // (antes, as cadeiras e portas do mapa aberto pelo mestre apareciam por cima do mapa do jogador).
 const vistaV158=()=>{try{return String(ctl()?.mapaAtual?.()||'');}catch(_){return '';}};
 const outraV158=()=>{const v=vistaV158();return !!v&&v!==String(mapa?.mapId||'');};
 const dims=()=>{if(outraV158()){try{const d=ctl()?.dimsAtual?.();if(d?.W)return d;}catch(_){}}return {W:Number(mapa?.larguraM)||28,H:Number(mapa?.alturaM)||14};};
 const objetosBase=()=>{if(outraV158()){try{const c=ctl()?.cenaAtual?.();return c&&String(c.mapId||'')===vistaV158()?(c.objects||[]):[];}catch(_){return [];}}return cena&&mapa?.mapId&&String(cena.mapId||'')===String(mapa.mapId)?(cena.objects||[]):[];};
 // v192: resposta imediata. Porta/luz que o jogador aciona e item que ele pega mudam NA HORA na tela dele; a mesa confirma logo depois
 // (a confirmação troca o estado otimista pelo real; se não vier em 6 s, volta ao que era e avisa).
 const otim=new Map();
 const objetos=()=>{const base=objetosBase();if(!otim.size)return base;const agora=Date.now(),out=[],vistos=new Set();
  for(const o of base){const k=String(o.id),ov=otim.get(k);if(!ov){out.push(o);continue;}vistos.add(k);
   if(agora>ov.ate){otim.delete(k);avisar('⚠️ A mesa não confirmou '+(ov.ocultar?'pegar ':'mexer em ')+(ov.nome||'o objeto')+' (o mestre está online?).');out.push(o);continue;}
   if(ov.ocultar)continue;if(ov.confirma(o)){otim.delete(k);out.push(o);continue;}out.push(ov.obj);}
  for(const [k,ov] of otim)if(!vistos.has(k)&&ov.ocultar)otim.delete(k);return out;};
 const objeto=id=>objetos().find(o=>String(o.id)===String(id))||null;
 function avisar(t){let n=el('moToast');if(!n){n=root.createElement('div');n.id='moToast';n.setAttribute('role','status');root.body.append(n);}n.textContent=t;n.classList.add('on');clearTimeout(n._t);n._t=setTimeout(()=>n.classList.remove('on'),3200);}
 const limpaNome=n=>String(n||'').replace(/^(NPC|Monstro|PJ|PM)\s*[·:-]\s*/i,'');
 // quem age: a miniatura que a pessoa controla agora
 function ator(){const c=ctl();try{const t=c?.ator?.();return t&&c.controla?.(t)?t:null;}catch(_){return null;}}
 // v192: ícone de item no chão = a imagem do próprio item (ou um emoji do tipo dele), nunca uma mãozinha
 const iconeItem=en=>{const mini=miniaturaDeItem(en);if(mini)return `<img src="${mini}" alt="" draggable="false">`;const img=String(imgEntrada(en)||'');if(img)return `<img src="${esc(img)}" alt="" draggable="false">`;const n=String(en?.nome||en?.idBanco||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  return en?.armaCaida?'🗡️':en?.tipo==='nota'?'📜':/pistola|rifle|carabina|blaster|laser|arma|escopeta/.test(n)?'🔫':/espada|sabre|faca|lamina|machado|adaga|lanca/.test(n)?'⚔️':/medic|kit|nanogel|antidoto|curativo/.test(n)?'🩹':/bateria|celula|municao|cartucho/.test(n)?'🔋':/armadura|colete|capacete/.test(n)?'🦺':/comida|racao|refeicao|agua|cafe|cerveja/.test(n)?'🍲':/chave/.test(n)?'🗝️':'📦';};
 const imgEntrada=en=>en?.tipo==='nota'?(en.imagem||NOTA_IMG):(en?.imagem||api()?.itemInfo?.(en?.idBanco)?.imagem||'');

 // ------------------------------------------------------------ desenho no mapa
 // v205: clicar no próprio objeto (porta, luz, assento, máquina, item) faz a ação — sem pílula desenhada. Pan/arrasto e cliques em miniaturas/botões não contam.
 function objetoSobPonto(e,b){
  const r=(el('moCamada')||b).getBoundingClientRect(),{W,H}=dims(),mx=(e.clientX-r.left)/r.width*W,my=(e.clientY-r.top)/r.height*H,a0=ator();let best=null,ba=1e9; // mesma referência da camada onde os objetos são desenhados
  for(const o of objetos()){if(!tipoInterativo(o)&&!itemSolto(o))continue;if(a0&&globalThis.mesaAndarV144?.colide?.(a0.id,o)===false)continue;
   const w=Number(o.larguraM)||1,h=Number(o.alturaM)||1,t=(Number(o.angulo)||0)*Math.PI/180,dx=mx-Number(o.x)*W/28,dy=my-Number(o.y)*H/14,lx=dx*Math.cos(t)+dy*Math.sin(t),ly=-dx*Math.sin(t)+dy*Math.cos(t);
   if(Math.abs(lx)<=w/2+.25&&Math.abs(ly)<=h/2+.25&&w*h<ba){best=o;ba=w*h;}}
  return best;}
 function instalarCliqueNoObjeto(b){
  let ini=null;b.addEventListener('pointerdown',e=>{ini={x:e.clientX,y:e.clientY};},true);
  b.addEventListener('click',e=>{
   if(e.button!==0||e.shiftKey||e.ctrlKey||e.altKey||e.metaKey)return;if(ini&&Math.hypot(e.clientX-ini.x,e.clientY-ini.y)>6)return;
   if(e.target.closest?.('[data-token],button,.mo-ic,.mo-vizinho,.ma-ic,#moBalao,#maBalao'))return;
   if(ehMestre()&&(todos||win.mesaEditorRapidoV197?.aberto?.()))return; // mestre configurando/construindo: o clique é dele
   const o=objetoSobPonto(e,b);if(o)rapido(o.id,e);});}
 function desenhar(){
  const b=board();if(!b)return;
  let cam=el('moCamada');if(!cam||cam.parentElement!==b){cam?.remove();cam=root.createElement('div');cam.id='moCamada';b.append(cam);
   cam.addEventListener('pointerdown',e=>{if(e.target.closest('.mo-ic,.mo-vizinho'))e.stopPropagation();});
   cam.addEventListener('click',e=>{const i=e.target.closest('.mo-ic,.mo-vizinho');if(i){e.stopPropagation();rapido(i.dataset.obj,e);}});chave='';}
  if(!b.dataset.moClique){b.dataset.moClique='1';instalarCliqueNoObjeto(b);}
  const m=ehMestre(),lista=objetos();
  // v139: cadeiras e bancos (muitos no mapa) só mostram o ícone perto do personagem selecionado
  const ag=(()=>{try{return ctl()?.ator?.()||null;}catch(_){return null;}})(),dd=dims(),perto=o=>!!ag&&Math.hypot((ag.x-o.x)*dd.W/28,(ag.y-o.y)*dd.H/14)<=2.6;
  // v209: item no chão sempre aparece (a imagem dele); objeto interativo só mostra ação quando perto
  const vis=lista.filter(o=>{const t=tipoInterativo(o);
   if(itemSolto(o))return true;
   if(t==='assento'&&!perto(o)&&!(globalThis.mesaRepouso?.ocupantes?.(o.id)||[]).length)return false;
   if(t)return (m&&todos)||perto(o);
   return m&&todos&&Number(o.camada||3)>=2&&!/parede|muro|piso|ch[aã]o|rua|telhado/i.test(String(o.nome||''));});
  const k=JSON.stringify([m,todos,vis.map(o=>[o.id,o.x,o.y,o.interativo,o.estadoInterativo,o.itemSolto,o.larguraM,o.alturaM,perto(o)]),dims()]);
  if(k===chave)return;chave=k;
  const {W,H}=dims();let css='',html='';
  // efeitos de estado valem para TODOS os interativos (porta aberta desliza, luz acesa clareia etc.),
  // independente de o personagem estar perto — a arte do mapa continua reagindo.
  for(const o of lista){const t=tipoInterativo(o);if(!t)continue;const e=estadoDe(o),x=Number(o.x)/28*100,y=Number(o.y)/14*100;
   const sel=`#novaSyncBoard [data-scene-object="${String(o.id).replace(/["\\]/g,'\\$&')}"]`;
   if(t==='porta'&&e.aberto){const horiz=((Math.round((Number(o.angulo)||0)/90))%2===0)===(Number(o.larguraM)>=Number(o.alturaM));css+=`${sel}{translate:${horiz?'88% 0':'0 88%'};opacity:.82}`;}
   if(t==='luz'&&e.ligado){css+=`${sel}{filter:drop-shadow(0 0 10px #ffe9a0) brightness(1.5)!important}`;const r=6;html+=`<div class="mo-luz" style="left:${x}%;top:${y}%;width:${r/W*100}%;height:${r/H*100}%"></div>`;}
   if(t==='maquina'&&e.ligado)css+=`${sel}{filter:drop-shadow(0 0 8px #6ff) brightness(1.25)!important}`;
   if(t==='recipiente'&&e.aberto)css+=`${sel}{filter:brightness(1.2) drop-shadow(0 0 4px #ffd447)!important}`;
  }
  for(const o of vis){
   const t=tipoInterativo(o),e=estadoDe(o),x=Number(o.x)/28*100,y=Number(o.y)/14*100,id=esc(o.id),solto=itemSolto(o);
   if(solto&&!t){html+=`<button type="button" class="mo-ic mo-item" data-obj="${id}" style="left:${x}%;top:${y}%" title="${esc(solto.nome||'Item')} · clique para pegar">${iconeItem(solto)}</button>`;continue;}
   if(t){
    const n=e.itens.length;
    if(m&&todos){ // modo configuração do mestre: ícones de todos os objetos no mapa
     const on=TIPOS[t].abre?e.aberto:e.ligado;
     html+=`<button type="button" class="mo-ic${e.trancado?' mo-tranc':''}${on&&!TIPOS[t].abre?' mo-on':''}" data-obj="${id}" style="left:${x}%;top:${y}%" title="${esc(o.nome)} · ${esc(descreverEstado(o))}${n?' · '+n+' item(ns) dentro':''}">${t==='recipiente'&&e.aberto?'📂':TIPOS[t].icone}</button>`;
    }else{ // v209: perto do personagem, uma pílula com a ação contextual (Abrir, Deitar, Ligar…)
     const acao=t==='porta'?(e.trancado?'Destrancar':e.aberto?'Fechar':'Abrir')
      :t==='recipiente'?(e.trancado?'Destrancar':e.aberto?`Ver dentro${n?' ('+n+')':''}`:'Abrir')
      :t==='luz'?(e.ligado?'Desligar':'Ligar')
      :t==='maquina'?(e.ligado?'Desligar':'Usar')
      :t==='descanso'?'Deitar':t==='recuperacao'?'Colocar alguém':'Sentar';
     const icone=(t==='recipiente'&&e.aberto?'📂':TIPOS[t].icone)+(e.trancado?' 🔒':'');
     html+=`<button type="button" class="mo-vizinho mo-quieto" tabindex="-1" aria-label="${esc(o.nome)}: ${esc(acao)}" data-obj="${id}" style="left:${x}%;top:${y}%" title="${esc(o.nome)} · ${esc(descreverEstado(o))}${m&&n?' · '+n+' item(ns) dentro':''}">${icone} ${acao}</button>`;
    }
   }else html+=`<button type="button" class="mo-ic mo-cfg" data-obj="${id}" style="left:${x}%;top:${y}%" title="${esc(o.nome)} · tornar interativo">⚙️</button>`;
  }
  cam.innerHTML=html;
  let st=el('moEstados');if(!st){st=root.createElement('style');st.id='moEstados';root.head.append(st);}if(st.textContent!==css)st.textContent=css;
  // botões do mestre: mostrar todos os objetos para configurar; soltar item/bilhete no chão
  const sc=b.parentElement;let tb=el('moTodos'),ts=el('moSoltar');
  if(m&&mapa?.mapId){
   if(getComputedStyle(sc).position==='static')sc.style.position='relative';
   if(!tb){tb=root.createElement('button');tb.type='button';tb.id='moTodos';tb.title='Objetos interativos: mostrar todos os objetos do mapa para escolher o que abre, liga, tranca ou guarda itens';
    tb.addEventListener('pointerdown',e=>e.stopPropagation());tb.addEventListener('click',()=>{todos=!todos;chave='';desenhar();});sc.append(tb);}
   tb.textContent=todos?'🚪 Interativos ✓':'🚪 Interativos';tb.setAttribute('aria-pressed',String(todos));
   if(!ts){ts=root.createElement('button');ts.type='button';ts.id='moSoltar';ts.title='Soltar um item do banco ou um bilhete no chão do mapa';
    ts.addEventListener('pointerdown',e=>e.stopPropagation());ts.addEventListener('click',()=>{if(colocando){colocando=null;board()?.classList.remove('mo-colocando');}abrirSoltar();});sc.append(ts);}
   ts.textContent=colocando?'📦 Clique no mapa…':'📦 Soltar item';ts.setAttribute('aria-pressed',String(!!colocando||soltarAberto));
  }else{tb?.remove();ts?.remove();}
  if(abertoId)desenharBalao();
 }

 // ------------------------------------------------------------ balão do objeto
 function garantirBalao(){if(!balao){balao=root.createElement('div');balao.id='moBalao';balao.hidden=true;root.body.append(balao);
   balao.addEventListener('pointerdown',e=>e.stopPropagation());balao.addEventListener('click',aoClicar);balao.addEventListener('change',aoMudar);
   balao.addEventListener('input',e=>{if(e.target.dataset.busca!==undefined){buscaItem=e.target.value;filtrarBusca();}});}
  return balao;}
 // v192: clicar age na hora, sem balão e sem "pedido à mesa": porta/luz/máquina destrancada liga ou abre, item no chão é pego.
 // O balão abre só quando precisa de decisão (trancado, baú, cápsula) ou com Shift+clique (mestre configura).
 function rapido(id,ev){
  const o=objeto(id);if(!o)return;const a=ator(),t=tipoInterativo(o),e=estadoDe(o),solto=itemSolto(o);
  if(ev?.shiftKey&&ehMestre())return abrir(id);
  const longe=()=>{const {W,H}=dims();return a&&distanciaObjeto(a,o,W,H)>ALCANCE_M+.6;};
  if(solto&&!t){if(!a)return abrir(id);if(longe())return avisar('Chegue mais perto para pegar: '+(solto.nome||'item'));return void pegarRapido(o,solto,a);}
  if(t&&t!=='recipiente'&&!TIPOS[t]?.repouso){
   if(e.trancado&&!(TIPOS[t].abre?e.aberto:e.ligado))return abrir(id);
   if(!a)return abrir(id);if(longe())return avisar('Chegue mais perto de '+(o.nome||'objeto')+'.');
   return void alternarRapido(o,a);}
  abrir(id);
 }
 async function alternarRapido(o,a){
  const base={objetoId:String(o.id),personagemId:String(a.id),nome:limpaNome(a.nome)||'Alguém'};
  try{const r=aplicarPedido(o,{...base,acao:'alternar'}),alvo=estadoDe(r.objeto);
   otim.set(String(o.id),{obj:r.objeto,nome:o.nome,ate:Date.now()+6000,confirma:oo=>{const x=estadoDe(oo);return x.aberto===alvo.aberto&&x.ligado===alvo.ligado;}});chave='';desenhar();
   await pedir({...base,acao:'alternar'});}
  catch(err){otim.delete(String(o.id));chave='';desenhar();avisar('⚠️ '+(err?.message||err));}
 }
 async function pegarRapido(o,solto,a){
  const base={objetoId:String(o.id),personagemId:String(a.id),nome:limpaNome(a.nome)||'Alguém'};
  try{if(!(await ctl()?.gastarAcao?.(a.id)??true))return avisar('No combate por turnos, pegar só na sua vez (gasta 1 ação).');
   otim.set(String(o.id),{ocultar:true,nome:solto.nome,ate:Date.now()+6000});chave='';desenhar();avisar('✋ Pegou: '+(solto.nome||'item'));
   await pedir({...base,acao:'pegar',uid:solto.uid,solto:true,arma:!!solto.armaCaida});}
  catch(err){otim.delete(String(o.id));chave='';desenhar();avisar('⚠️ '+(err?.message||err));}
 }
 function abrir(id){abertoId=String(id);soltarAberto=false;formAberto=false;resultado='';selItem='';lendo='';buscaItem='';garantirBalao();balao.hidden=false;balao.dataset.h='';desenharBalao();posicionar();}
 function fechar(){abertoId='';soltarAberto=false;if(balao)balao.hidden=true;desenhar();}
 function posicionar(alvo){
  const ic=alvo||el('moCamada')?.querySelector(`[data-obj="${CSS.escape(abertoId)}"]`)||board()?.querySelector(`[data-scene-object="${CSS.escape(String(abertoId))}"]`);if(!ic||!balao)return; // v209: âncora cai na arte do objeto quando não há ícone
  const r=ic.getBoundingClientRect(),w=balao.offsetWidth||300,h=balao.offsetHeight||200;
  let x=r.right+8,y=r.top-10;if(x+w>win.innerWidth-8)x=r.left-w-8;x=Math.max(8,Math.min(win.innerWidth-w-8,x));y=Math.max(8,Math.min(win.innerHeight-h-8,y));
  balao.style.left=Math.round(x+win.scrollX)+'px';balao.style.top=Math.round(y+win.scrollY)+'px';
 }
 let valores=new Map();
 const aoRedimensionar=()=>{if(balao&&!balao.hidden)posicionar();};win.addEventListener('resize',aoRedimensionar);
 async function valorPericia(t,nome){
  const k=t.id+'|'+nome;if(valores.has(k))return valores.get(k);
  const p=(async()=>{try{return await api()?.valor?.(t,nome)||null;}catch(_){return null;}})();valores.set(k,p);setTimeout(()=>valores.delete(k),60000);return p;
 }
 function quadrado(en,{mestre=false}={}){
  const img=imgEntrada(en);
  return `<button type="button" class="mo-sq" data-sel="${esc(en.uid)}" aria-pressed="${String(selItem===en.uid)}" title="${esc(en.nome||'Item')}">${img?`<img src="${esc(img)}" alt="">`:(en.tipo==='nota'?'📜':'📦')}${mestre?`<span class="mo-x" data-tirar="${esc(en.uid)}" title="Tirar daqui">✕</span>`:''}</button>`;
 }
 function detalhe(en,{pode,motivo}){
  if(!en)return '';
  const info=en.tipo==='nota'?null:api()?.itemInfo?.(en.idBanco);
  let h=`<div class="mo-det"><b>${en.tipo==='nota'?'📜 ':''}${esc(en.nome||info?.nome||'Item')}</b>`;
  if(en.armaCaida)h+=`<p>Arma derrubada${en.armaCaida.donoNome?' de '+esc(en.armaCaida.donoNome):''}.</p>`;
  if(info?.descricao)h+=`<p>${esc(info.descricao.slice(0,400))}</p>`;
  if(info)h+=`<p>${info.categoria?esc(info.categoria)+' · ':''}${info.peso} kg</p>`;
  if(en.tipo==='nota'&&lendo===en.uid)h+=`<div class="mo-nota">${esc(en.texto||'(em branco)')}</div>`;
  h+=`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">`;
  if(en.tipo==='nota')h+=`<button type="button" class="mo-b" data-ler="${esc(en.uid)}" ${pode?'':'disabled'}>📖 ${lendo===en.uid?'Fechar':'Ler'}</button>`;
  h+=`<button type="button" class="mo-b" data-pegar="${esc(en.uid)}" ${pode?'':'disabled'} title="Guardar na mochila${en.armaCaida?' (gasta tempo de ação)':''}">✋ Pegar${en.armaCaida?' (gasta tempo)':''}</button></div>`;
  if(!pode&&motivo)h+=`<div class="mo-aviso">${esc(motivo)}</div>`;
  return h+'</div>';
 }
 function desenharBalao(){
  if(!balao||balao.hidden)return;
  if(soltarAberto){desenharSoltar();return;}
  if(!abertoId)return;const o=objeto(abertoId);if(!o){fechar();return;}
  const t=tipoInterativo(o),e=estadoDe(o),m=ehMestre(),a=ator(),T=TIPOS[t]||null,solto=!t?itemSolto(o):null;
  const {W,H}=dims(),dist=a?distanciaObjeto(a,o,W,H):null,perto=!!a&&dist<=ALCANCE_M;
  const motivo=!a?(m?'Para pegar, atue como um personagem (🎭).':'Selecione o seu personagem.'):!perto?`Chegue mais perto: ${dist.toFixed(1).replace('.',',')} m (até ${ALCANCE_M} m).`:'';
  let h=`<h4>${solto?(solto.tipo==='nota'?'📜':'✋'):T?T.icone:'⚙️'} <span title="${esc(o.nome)}">${esc(solto?solto.nome||o.nome:o.nome||'Objeto')}</span><button type="button" data-fechar title="Fechar">✕</button></h4>`;
  if(solto){
   h+=`<div class="mo-st">No chão</div>`;selItem=solto.uid;
   h+=detalhe(solto,{pode:perto,motivo});
   if(m)h+=`<div class="mo-mestre"><button type="button" class="mo-b" data-apagar-solto>🗑️ Tirar do mapa</button></div>`;
   h+=`<div class="mo-res" data-res>${esc(resultado)}</div>`;
   return pintar(h);
  }
  h+=`<div class="mo-st">${T?esc(descreverEstado(o)):'Objeto comum (não interativo)'}</div>`;
  if(T){
   if(!a&&!m)h+='<div class="mo-aviso">Selecione o seu personagem para interagir.</div>';
   else if(a&&!perto)h+=`<div class="mo-aviso">📏 Chegue mais perto: ${dist.toFixed(1).replace('.',',')} m (até ${ALCANCE_M} m).</div>`;
   const pode=m&&!a?true:perto;
   h+='<div class="mo-bts">';
   if(T.repouso){ // v135: cama / cápsula
    const R=globalThis.mesaRepouso,oc=R?.ocupantes?.(o.id)||[],toks=ctl()?.tokensNoMapa?.()||[];
    for(const x of oc){const tk=toks.find(z=>z.id===x.id);h+=`<div class="mo-aviso">${T.repouso==='cura'?'🩺':T.repouso==='sentado'?'🪑':'😴'} ${esc(limpaNome(tk?.nome||'Alguém'))} · ${Number(x.horas||0)} h</div>`;
     if(T.repouso!=='sentado'&&(m||a&&(x.id===a.id||tk&&String(tk.donoUid||'')===uid())))h+=`<button type="button" class="mo-b" data-levantar="${esc(x.id)}">${T.repouso==='cura'?'🚪 Tirar da cápsula':'⏰ Acordar'}</button>`;}
    if(!oc.length&&(a||m)){
     if(a&&!R?.emRepouso?.(a.id))h+=`<button type="button" class="mo-b" data-deitar="${esc(a.id)}" ${pode?'':'disabled'}>${T.repouso==='cura'?'🩺 Entrar na cápsula':T.repouso==='sentado'?'🪑 Sentar aqui':'😴 Dormir aqui'}</button>`;
     // colocar outra pessoa (desacordada ou ferida) que esteja perto
     const {W,H}=dims();for(const z of toks){if(z.id===a?.id||R?.emRepouso?.(z.id))continue;if(distanciaObjeto(z,o,W,H)>ALCANCE_M+.6)continue;h+=`<button type="button" class="mo-b" data-deitar="${esc(z.id)}" ${pode?'':'disabled'}>${T.repouso==='cura'?'🩺 Colocar':T.repouso==='sentado'?'🪑 Sentar':'🛏️ Deitar'} ${esc(limpaNome(z.nome))}</button>`;}
    }
    if(!globalThis.mesaRelogio?.ativo?.())h+='<div class="mo-aviso">⏰ O relógio do jogo está parado: o tempo só passa quando o mestre ligar.</div>';
    h+=`<div class="mo-aviso" style="opacity:.8">${T.repouso==='cura'?'+1 PV por hora em cada parte ferida; estabiliza e tira do coma.':T.repouso==='sentado'?'Sentado, a Fadiga melhora devagar (cerca de ⅓ do sono), sem limite de vezes.':'A Fadiga melhora com as horas de sono (uma vez por dia, até 8 h).'}</div>`;
   }
   else if(T.abre){if(!e.trancado||e.aberto)h+=`<button type="button" class="mo-b" data-alternar ${pode?'':'disabled'}>${e.aberto?(t==='porta'?'🚪 Fechar':'📁 Fechar'):(t==='porta'?'🚪 Abrir':'📂 Abrir')}</button>`;}
   else if(!e.trancado||e.ligado)h+=`<button type="button" class="mo-b" data-alternar ${pode?'':'disabled'}>${e.ligado?'⏻ Desligar':'⏻ Ligar'}</button>`;
   if(e.trancado&&!(T.abre?e.aberto:e.ligado)&&a){let tem=false;try{tem=(api()?.chaves?.(a.id)||[]).some(k=>chaveServe(k,o));}catch(_){}
    if(tem||m&&!ehPJ(a.id))h+=`<button type="button" class="mo-b" data-chave ${pode?'':'disabled'}>🔑 Usar a chave</button>`;}
   if(e.trancado&&!(T.abre?e.aberto:e.ligado)){
    if(a){const usados=e.tentativas?.[a.id]||{};
     h+=`<div class="mo-aviso">${T.abre?'🔒 Trancado. Tente com uma perícia:':'🔒 Não responde. Tente com uma perícia:'}</div>`;
     for(const p of T.pericias){const feito=usados[p];h+=`<button type="button" class="mo-b" data-teste="${esc(p)}" ${!perto||feito?'disabled':''} title="${feito?'Já tentou: '+esc(feito):'Rolar '+esc(p)}"><span>${/for[cç]a/i.test(p)?'💪':/segur|ciber/i.test(p)?'🗝️':/comput/i.test(p)?'⌨️':'⚙️'} ${esc(p)}</span><em data-valor="${esc(p)}">${feito?esc(feito):'…'}</em></button>`;}
     const dif=DIFICULDADES.find(d=>d[0]===e.dificuldade);if(dif&&dif[0]!=='padrao')h+=`<div class="mo-aviso">Dificuldade: ${esc(dif[1])}</div>`;
    }else if(!m)h+='<div class="mo-aviso">🔒 Trancado.</div>';
   }
   h+='</div>';
   if(T.abre&&e.aberto&&e.conteudo)h+=`<div class="mo-dentro">📦 ${esc(e.conteudo)}</div>`;
   if(T.abre&&(e.aberto||m)){
    h+=`<div class="mo-grade">${e.itens.map(en=>quadrado(en,{mestre:m})).join('')||'<div class="mo-vazio">Vazio.</div>'}${!e.aberto&&m?'':''}</div>`;
    if(!e.aberto&&m&&e.itens.length)h+='<div class="mo-aviso">(fechado: só o mestre vê o que tem dentro)</div>';
    const en=e.itens.find(x=>x.uid===selItem);if(en)h+=detalhe(en,{pode:e.aberto&&perto,motivo:e.aberto?motivo:'Abra primeiro.'});
   }
  }
  // v135: ferramentas — machado corta madeira, picareta quebra pedra; extintor apaga o fogo
  if(a&&!o.destruido){const fer=api()?.ferramentas?.(a.id)||{},f=ferramentaPara(o,fer);let x='';
   if(f&&o.destrutivel!==false)x+=`<button type="button" class="mo-b" data-quebrar="${f.id}" ${perto?'':'disabled'} title="Teste de Força Bruta com +20 pela ferramenta">${f.icone} ${f.verbo} com ${f.id==='machado'?'o machado':'a picareta'}</button>`;
   if((m||T?.repouso!=='sentado')&&globalThis.mesaArrastar?.arrastavel?.(o)&&!Object.values(globalThis.mesaArrastando?.()||{}).some(v=>v.alvo?.id===o.id))x+=`<button type="button" class="mo-b" data-arrastar ${perto?'':'disabled'} title="Puxar o objeto: ele vem atrás de você (mais devagar se for pesado)">✋ Arrastar</button>`;
   if(o.pegandoFogo&&fer.extintor)x+=`<button type="button" class="mo-b" data-extintor ${perto?'':'disabled'}>🧯 Apagar com o extintor</button>`;
   if(x)h+=`<div class="mo-bts">${x}</div>`;}
  if(m){
   h+=`<div class="mo-mestre"><label>Tipo <select data-tipo>${[['','Automático (pelo nome)'],['porta','🚪 Porta'],['recipiente','🗄️ Gaveta / armário / baú'],['luz','💡 Luz'],['maquina','💻 Máquina'],['descanso','🛏️ Cama / cápsula de descanso'],['recuperacao','🩺 Cápsula de recuperação'],['nenhum','— Não interativo']].map(([k,n])=>`<option value="${k}"${String(o.interativo||'')===k?' selected':''}>${n}</option>`).join('')}</select></label>`;
   if(T){h+=`<div class="mo-linha" style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="mo-b" data-mestre-alternar>${T.abre?(e.aberto?'Fechar':'Abrir'):(e.ligado?'Desligar':'Ligar')} (mestre)</button><button type="button" class="mo-b" data-trancar>${e.trancado?'🔓 Destrancar':(T.abre?'🔒 Trancar':'🔒 Travar')}</button><button type="button" class="mo-b" data-zerar title="Libera novas tentativas para todos">↺ Tentativas</button></div>
    <label>Dificuldade <select data-dif>${DIFICULDADES.map(([k,n])=>`<option value="${k}"${e.dificuldade===k?' selected':''}>${n}</option>`).join('')}</select></label>`;
    if(T.abre)h+=formAdicionar('dentro');}
   h+='</div>';
  }
  h+=`<div class="mo-res" data-res>${esc(resultado)}</div>`;
  pintar(h,()=>preencherValores(o,a,e));
 }
 function formAdicionar(onde){
  if(onde==='dentro'&&!formAberto)return '<button type="button" class="mo-b" data-form-toggle>＋ Guardar item ou bilhete aqui</button>';
  return `<div style="display:grid;gap:5px"><b style="font-size:12px;color:#8ee7ff">${onde==='dentro'?'Guardar aqui dentro':'O que soltar no chão'}</b>
   <input type="search" data-busca placeholder="Buscar item do banco…" value="${esc(buscaItem)}"><select data-item-banco size="4" style="height:auto!important;min-height:80px">${opcoesItens()}</select>
   <button type="button" class="mo-b" data-add-item="${onde}">＋ Item escolhido</button>
   <input type="text" data-nota-titulo placeholder="Título do bilhete (ex.: Bilhete rasgado)">
   <textarea data-nota-texto placeholder="Texto do bilhete — o jogador pode ler sem levar, ou guardar e ler depois"></textarea>
   <button type="button" class="mo-b" data-add-nota="${onde}">＋ 📜 Bilhete</button></div>`;
 }
 function opcoesItens(){const q=sem(buscaItem);return (api()?.itens?.()||[]).filter(i=>!q||sem(i.nome).includes(q)||sem(i.categoria).includes(q)).slice(0,80).map(i=>`<option value="${esc(i.id)}">${esc(i.nome)}${i.categoria?' · '+esc(i.categoria):''}</option>`).join('');}
 function filtrarBusca(){const s=balao?.querySelector('[data-item-banco]');if(s)s.innerHTML=opcoesItens();}
 function pintar(h,depois){
  if(balao.dataset.h===h)return;
  const foco=balao.contains(root.activeElement)&&/textarea|select|input/i.test(root.activeElement.tagName);if(foco)return;
  balao.innerHTML=h;balao.dataset.h=h;depois?.();
 }
 async function preencherValores(o,a,e){
  if(!a)return;for(const span of balao.querySelectorAll('[data-valor]')){if(span.textContent!=='…')continue;const p=span.dataset.valor;
   const v=await valorPericia(a,p);const alvo=balao.querySelector(`[data-valor="${CSS.escape(p)}"]`);if(!alvo||alvo.textContent!=='…')continue;
   alvo.textContent=v?valorComDificuldade(v.valor,e.dificuldade)+'%':'—';if(!v)alvo.closest('button').disabled=true;}
 }
 // painel do mestre para soltar item/bilhete no chão
 function abrirSoltar(){garantirBalao();abertoId='';soltarAberto=true;resultado='';buscaItem='';balao.hidden=false;balao.dataset.h='';desenharSoltar();posicionar(el('moSoltar'));desenhar();}
 function desenharSoltar(){pintar(`<h4>📦 <span>Soltar no chão</span><button type="button" data-fechar title="Fechar">✕</button></h4>${formAdicionar('chao')}<div class="mo-aviso">Depois de escolher, clique no lugar do mapa.</div><div class="mo-res" data-res>${esc(resultado)}</div>`);}

 // ------------------------------------------------------------ ações
 // v205: quem anda sentado/deitado levanta sozinho (chamado pelo movimento)
 win.mesaLevantarAoAndarV205=async id=>{const rp=win.mesaRepouso?.emRepouso?.(id);if(!rp||!rp.objetoId)return false;const a=ctl()?.token?.(id);await pedir({objetoId:String(rp.objetoId),personagemId:String(id),nome:limpaNome(a?.nome)||'Alguém',acao:'levantar',alvoId:String(id)});return true;};
 async function pedir(cmd){
  const o=objeto(cmd.objetoId);if(!o)throw Error('Objeto não encontrado.');
  if(ehMestre())return cmd.acao==='pegar'?aplicarPegar(cmd):['deitar','levantar'].includes(cmd.acao)?aplicarRepouso(cmd):aplicarAgora(cmd);
  if(win.mesaJogoPausadoV214?.())throw Error('Jogo pausado pelo mestre.');
  const ref=D(ACOES+'/'+crypto.randomUUID());
  return new Promise((resolve,reject)=>{
   let stop=null,fim=false;
   const terminar=e=>{if(fim)return;fim=true;clearTimeout(timer);stop?.();e?reject(e):resolve('');};
   const timer=setTimeout(()=>terminar(Error('Não foi possível confirmar a ação. Verifique a conexão e se a aba do mestre está aberta.')),15000);
   Promise.resolve().then(()=>dep.setDoc(ref,clean({...cmd,donoUid:uid(),mapId:vistaV158()||String(mapa?.mapId||''),criadoEm:Date.now(),status:'pending'}))).then(()=>{
    if(fim)return;
    try{stop=dep.onSnapshot(ref,s=>{const r=s.exists()?s.data():null;if(r?.status==='done')terminar();else if(r?.status==='rejected')terminar(Error(r.message||'Ação recusada.'));},terminar);if(fim)stop?.();}catch(e){terminar(e);}
   },terminar);
  }); // sucesso comum silencioso; recusa ou atraso real continuam visíveis
 }
 function entradaDoForm(){
  const sel=balao.querySelector('[data-item-banco]'),id=sel?.value;if(!id)return null;const info=api()?.itemInfo?.(id);
  return {uid:novoUid(),tipo:'item',idBanco:String(id),nome:String(info?.nome||id),imagem:String(info?.imagem||'')};
 }
 function notaDoForm(){
  const t=balao.querySelector('[data-nota-titulo]')?.value.trim(),x=balao.querySelector('[data-nota-texto]')?.value.trim();if(!x&&!t)return null;
  return {uid:novoUid(),tipo:'nota',nome:(t||'Bilhete').slice(0,80),texto:(x||'').slice(0,2000)};
 }
 async function aoClicar(ev){
  const b=ev.target.closest('button,[data-tirar]');if(!b)return;
  if(b.dataset.fechar!==undefined){fechar();return;}
  const m=ehMestre();
  // soltar no chão (mestre)
  if(soltarAberto&&(b.dataset.addItem==='chao'||b.dataset.addNota==='chao')){
   const en=b.dataset.addItem?entradaDoForm():notaDoForm();if(!en){resultado='Escolha um item ou escreva o bilhete.';desenharSoltar();return;}
   colocando=en;board()?.classList.add('mo-colocando');resultado='Agora clique no lugar do mapa.';balao.dataset.h='';desenharSoltar();desenhar();return;
  }
  const o=objeto(abertoId);if(!o)return;const a=ator(),e=estadoDe(o);
  const base={objetoId:String(o.id),personagemId:String(a?.id||''),nome:limpaNome(a?.nome)||(m?'O mestre':'Alguém')};
  try{
   if(b.dataset.tirar){ev.stopPropagation();await aplicarAgora({...base,acao:'mestre',patch:{itens:e.itens.filter(x=>x.uid!==b.dataset.tirar)}});}
   else if(b.dataset.formToggle!==undefined){formAberto=!formAberto;}
   else if(b.dataset.sel){selItem=selItem===b.dataset.sel?'':b.dataset.sel;lendo='';}
   else if(b.dataset.ler){lendo=lendo===b.dataset.ler?'':b.dataset.ler;}
   else if(b.dataset.pegar){
    if(!a)throw Error('Escolha quem vai pegar (o seu personagem).');
    const solto=itemSolto(o),en=solto||e.itens.find(x=>x.uid===b.dataset.pegar);
    if(!(await ctl()?.gastarAcao?.(a.id)??true))throw Error('No combate por turnos, pegar só na sua vez (gasta 1 ação).');
    b.disabled=true;resultado=await pedir({...base,acao:'pegar',uid:b.dataset.pegar,solto:!!solto,arma:!!en?.armaCaida})||'';selItem='';lendo='';
   }
   else if(b.dataset.apagarSolto!==undefined){await removerSolto(o.id);fechar();return;}
   else if(b.dataset.addItem==='dentro'||b.dataset.addNota==='dentro'){
    const en=b.dataset.addItem?entradaDoForm():notaDoForm();if(!en){resultado='Escolha um item ou escreva o bilhete.';}
    else{await aplicarAgora({...base,acao:'mestre',patch:{itens:[...e.itens,en]}});resultado='Guardado: '+en.nome;}
   }
   else if(b.dataset.alternar!==undefined){b.disabled=true;resultado=await pedir({...base,acao:'alternar'})||'';}
   else if(b.dataset.deitar){b.disabled=true;resultado=await pedir({...base,acao:'deitar',alvoId:b.dataset.deitar})||'';}
   else if(b.dataset.levantar){b.disabled=true;resultado=await pedir({...base,acao:'levantar',alvoId:b.dataset.levantar})||'';}
   else if(b.dataset.quebrar){
    if(!a)return;const f=ferramentaPara(o,api()?.ferramentas?.(a.id)||{});if(!f)return;const v=await valorPericia(a,'Força Bruta');if(!v){resultado='A ficha não tem Força Bruta.';desenharBalao();return;}
    const valor=Math.min(100,v.valor+20),rr=api()?.rolar?.(valor);if(!rr)throw Error('Rolagem indisponível.');b.disabled=true;
    resultado=`🎲 Força Bruta (+20 ${f.nome}): ${rr.die}/${valor} → ${rr.grau}${rr.sucesso?' ✅':' ❌'}`;desenharBalao();
    const s2=await pedir({...base,acao:'quebrar',icone:f.icone,verbo:f.verbo,ferramenta:f.id==='machado'?'o machado':'a picareta',teste:{pericia:'Força Bruta',valor,die:rr.die,grau:rr.grau,sucesso:!!rr.sucesso}});if(s2&&!m)resultado+=' · '+s2;
   }
   else if(b.dataset.arrastar!==undefined){if(!a)return;b.disabled=true;try{resultado=String(await globalThis.mesaArrastar?.pedir?.({acao:'arrastar',personagemId:a.id,alvoTipo:'objeto',alvoId:o.id})||'');}catch(err){resultado='⚠️ '+(err?.message||err);}}
   else if(b.dataset.extintor!==undefined){if(!a)return;b.disabled=true;try{resultado=String(await ctl()?.suporte?.({kind:'direct-extinguish',actorId:a.id,targetId:a.id,objectId:o.id,turnId:null})||'🧯 Pedido enviado.');}catch(err){resultado='⚠️ '+(err?.message||err);}}
   else if(b.dataset.chave!==undefined){if(!a)return;b.disabled=true;resultado=await pedir({...base,acao:'chave'})||'';}
   else if(b.dataset.teste){
    if(!a)return;const p=b.dataset.teste,v=await valorPericia(a,p);if(!v){resultado='A ficha não tem '+p+'.';desenharBalao();return;}
    const fer=api()?.ferramentas?.(a.id)||{},bonus=/for[cç]a bruta/i.test(p)&&(fer.machado||fer.pecabra||fer.picareta)?20:0; // v135: machado / pé de cabra ajudam a arrombar
    const valor=Math.min(100,valorComDificuldade(v.valor+bonus,e.dificuldade)),r=api()?.rolar?.(valor);if(!r)throw Error('Rolagem indisponível.');
    b.disabled=true;resultado=`🎲 ${p}${bonus?" (+20 ferramenta)":""}: ${r.die}/${valor} → ${r.grau}${r.sucesso?' ✅':' ❌'}`;desenharBalao();
    const s=await pedir({...base,acao:'teste',teste:{pericia:p,valor,die:r.die,grau:r.grau,sucesso:!!r.sucesso}});if(s&&!m)resultado+=' · '+s;
   }
   else if(b.dataset.mestreAlternar!==undefined)await aplicarAgora({...base,nome:'O mestre',acao:'mestre',patch:TIPOS[tipoInterativo(o)]?.abre?{aberto:!e.aberto}:{ligado:!e.ligado}});
   else if(b.dataset.trancar!==undefined)await aplicarAgora({...base,acao:'mestre',patch:{trancado:!e.trancado}});
   else if(b.dataset.zerar!==undefined){await aplicarAgora({...base,acao:'mestre',patch:{zerar:true}});resultado='Tentativas liberadas.';}
  }catch(err){resultado='⚠️ '+(err?.message||err);}
  balao.dataset.h='';desenharBalao();
 }
 async function aoMudar(ev){
  const s=ev.target,o=objeto(abertoId);if(!o||!ehMestre())return;const base={objetoId:String(o.id),acao:'mestre',nome:'O mestre'};
  try{
   if(s.dataset.tipo!==undefined)await aplicarAgora({...base,objeto:{interativo:s.value}});
   else if(s.dataset.dif!==undefined)await aplicarAgora({...base,patch:{dificuldade:s.value}});
   else return;
  }catch(err){resultado='⚠️ '+(err?.message||err);}
  s.blur?.();balao.dataset.h='';desenharBalao();
 }
 // clique no mapa para soltar o item escolhido (mestre)
 root.addEventListener('pointerdown',async e=>{
  if(!colocando||!ehMestre())return;const b=board();if(!b||!b.contains(e.target))return;
  e.preventDefault();e.stopPropagation();const r=b.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*28,y=(e.clientY-r.top)/r.height*14;
  const en=colocando;colocando=null;b.classList.remove('mo-colocando');
  try{await soltarNoChao(en,x,y);resultado='Solto no chão: '+en.nome;}catch(err){resultado='⚠️ '+(err?.message||err);}
  desenhar();if(soltarAberto){balao.dataset.h='';desenharSoltar();}
 },true);

 // ------------------------------------------------------------ aplicar (navegador do mestre)
 const linhaHist=(msg,donoUid='')=>({id:'obj:'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),ts:Date.now(),actorUid:String(donoUid||''),targetUid:'',message:msg});
 async function anotar(tx,msg,donoUid){const hs=await tx.get(D(HIST)),hh=hs.exists()?hs.data():{entries:[],revision:0};return ()=>tx.set(D(HIST),clean({entries:[...(hh.entries||[]),linhaHist(msg,donoUid)].slice(-120),revision:Number(hh.revision||0)+1}));}
 // v135: deitar para dormir / entrar na cápsula de recuperação (o tempo passa pelo relógio do jogo)
 async function aplicarRepouso(cmd){
  const R=globalThis.mesaRepouso;if(!R)throw Error('Relógio do jogo ainda carregando.');
  const o=objeto(cmd.objetoId),t=tipoInterativo(o),alvo=String(cmd.alvoId||cmd.personagemId||'');if(!o||!TIPOS[t]?.repouso)throw Error('Aqui não dá para deitar.');
  if(cmd.acao==='levantar'){await R.levantar({alvoId:alvo});return 'Levantou.';}
  const tk=ctl()?.token?.(alvo);if(!tk)throw Error('Personagem não está no mapa.');
  const {W,H}=dims();if(distanciaObjeto(tk,o,W,H)>ALCANCE_M+.6)throw Error('Traga '+limpaNome(tk.nome)+' para perto primeiro.');
  if((R.ocupantes(o.id)||[]).length)throw Error(o.nome+' já está ocupada.');
  await R.deitar({alvoId:alvo,objeto:o,tipo:TIPOS[t].repouso});return TIPOS[t].repouso==='cura'?'🩺 Na cápsula.':TIPOS[t].repouso==='sentado'?'🪑 Sentado.':'😴 Dormindo.';
 }
 // v158: pedido de um mapa que não é o aberto pelo mestre mexe na cena guardada daquele mapa
 const cenaDoc=mid=>!mid||String(mid)===String(mapa?.mapId||'')?D(SCENE):D('combatesAtivos/mapaMesaSyncCena_'+String(mid));
 async function aplicarAgora(cmd){
  let msg='';
  await dep.runTransaction(dep.db,async tx=>{
   const s=await tx.get(cenaDoc(cmd.mapId)),c=s.exists()?s.data():null;if(!c)throw Error('Cena não encontrada.');
   if(cmd.mapId&&String(c.mapId||'')!==String(cmd.mapId))throw Error('O mapa mudou.');
   const i=(c.objects||[]).findIndex(o=>String(o.id)===String(cmd.objetoId));if(i<0)throw Error('Objeto não encontrado.');
   if(cmd.acao==='chave'){ // v134: confere a chave no inventário de quem pediu
    const quem=String(cmd.personagemId||'');let nomeChave='';
    if(ehPJ(quem)){const f=await tx.get(D(fichaPath(quem))),inv=f.exists()?f.data()?.inventario||{}:{};
     for(const comp of ['equipado','bolso','mochila'])for(const it of inv[comp]||[])if(!nomeChave&&it&&chaveServe(it,c.objects[i]))nomeChave=String(it.nome||it.name||'a chave');}
    else if(ehMestre())nomeChave='a chave';
    if(!nomeChave)throw Error('Sem a chave de '+(c.objects[i].nome||'esta porta')+'.');
    cmd={...cmd,chaveNome:nomeChave};
   }
   const r=aplicarPedido(c.objects[i],cmd);msg=r.msg;
   const objects=[...c.objects];objects[i]=r.objeto;
   const hist=msg?await anotar(tx,msg,cmd.donoUid):null;
   tx.set(cenaDoc(cmd.mapId),clean({...c,objects}));hist?.();
  });
  return msg;
 }
 async function soltarNoChao(en,x,y){
  await dep.runTransaction(dep.db,async tx=>{
   const s=await tx.get(D(SCENE)),c=s.exists()?s.data():null;if(!c)throw Error('Cena não encontrada.');
   const img=imgEntrada(en)||(en.tipo==='nota'?NOTA_IMG:'');
   const o={id:'chao_'+novoUid(),nome:(en.tipo==='nota'?'📜 ':'')+String(en.nome||'Item'),x:Math.max(.3,Math.min(27.7,x)),y:Math.max(.3,Math.min(13.7,y)),larguraM:en.tipo==='nota'?.45:.6,alturaM:en.tipo==='nota'?.45:.6,angulo:Math.round(Math.random()*40-20),camada:1,bloqueiaMovimento:false,bloqueiaVisao:false,imagem:img||ARMA_IMG,itemSolto:clean(en)};
   tx.set(D(SCENE),clean({...c,objects:[...(c.objects||[]),o]}));
  });
 }
 async function removerSolto(id){
  await dep.runTransaction(dep.db,async tx=>{const s=await tx.get(D(SCENE)),c=s.exists()?s.data():null;if(!c)return;tx.set(D(SCENE),clean({...c,objects:(c.objects||[]).filter(o=>String(o.id)!==String(id))}));});
 }
 const ehPJ=id=>!decodeURIComponent(String(id||'')).startsWith('sync')&&!!id;
 const fichaPath=id=>'personagens/'+decodeURIComponent(String(id));
 // pegar: tira do armário/chão e põe na mochila do personagem (tudo numa transação)
 async function aplicarPegar(cmd){
  let msg='',arma=null;const quem=String(cmd.personagemId||''),A=api();if(!A)throw Error('Ponte de itens indisponível.');
  await dep.runTransaction(dep.db,async tx=>{
   const s=await tx.get(cenaDoc(cmd.mapId)),c=s.exists()?s.data():null;if(!c)throw Error('Cena não encontrada.');
   if(cmd.mapId&&String(c.mapId||'')!==String(cmd.mapId))throw Error('O mapa mudou.');
   const i=(c.objects||[]).findIndex(o=>String(o.id)===String(cmd.objetoId));if(i<0)throw Error('Este item não está mais aí.');
   const o=c.objects[i],solto=itemSolto(o);let en,objects=[...c.objects];
   if(solto){if(String(solto.uid)!==String(cmd.uid))throw Error('Este item não está mais aí.');en=solto;objects.splice(i,1);}
   else{const r=aplicarPedido(o,{...cmd,acao:'pegar'});en=itensDentro(o).find(x=>String(x.uid)===String(cmd.uid));objects[i]=r.objeto;}
   const nomeQuem=limpaNome(cmd.nome)||'Alguém';
   // arma derrubada
   const ac=en.armaCaida||null,dono=ac?String(ac.dono||''):'';
   const hp=ac?(await tx.get(D(HEALTH))):null,hpd=hp?.exists()?hp.data():null;
   const fichaQuem=ehPJ(quem)&&!(ac&&dono===quem)?await tx.get(D(fichaPath(quem))):null;
   const fichaDono=ac&&dono&&dono!==quem&&ehPJ(dono)?await tx.get(D(fichaPath(dono))):null;
   let inst=null,writes=[];
   if(ac&&dono===quem){msg=`🗡️ ${nomeQuem} pegou de volta a arma: ${ac.nome||en.nome}`;}
   else{
    if(fichaDono?.exists()){const r=A.retirarArma(fichaDono.data(),ac.key);writes.push(()=>tx.set(D(fichaPath(dono)),{inventario:r.inventario},{merge:true}));inst=r.item;}
    inst=inst||A.instancia(en);
    if(fichaQuem?.exists()){const g=A.guardar(fichaQuem.data(),inst);writes.push(()=>tx.set(D(fichaPath(quem)),{inventario:g.inventario},{merge:true}));msg=`✋ ${nomeQuem} pegou ${en.tipo==='nota'?'📜 ':''}${en.nome||'um item'}${solto?'':' ('+String(o.nome||'')+')'} · guardou (${g.comp})`;}
    else msg=`✋ ${nomeQuem} pegou ${en.nome||'um item'}${solto?'':' ('+String(o.nome||'')+')'}`;
   }
   if(hpd&&ac&&dono&&(dono===quem||ehPJ(dono))){const at=hpd.actors?.[dono];if(at?.combateLab?.armaCaida){const actors={...hpd.actors,[dono]:{...at,combateLab:{...at.combateLab,armaCaida:null}}};writes.push(()=>tx.set(D(HEALTH),clean({...hpd,actors,revision:Number(hpd.revision||0)+1})));}}
   if(ac)arma=true;
   const hist=await anotar(tx,msg,cmd.donoUid);
   tx.set(cenaDoc(cmd.mapId),clean({...c,objects}));writes.forEach(f=>f());hist();
  });
  // pegar gasta tempo no combate em tempo real
  try{const ms=rt()?.atrasar?.(quem,arma?1.5:1);if(ms)msg+=' · ⏳ '+(ms/1000).toFixed(1).replace('.',',')+' s';}catch(_){}
  return msg;
 }
 async function processar(id,cmd){
  if(cmd.status==='done'||cmd.status==='rejected'){
   if(Date.now()-Number(cmd.concluidoEm||cmd.criadoEm||0)>60000&&dep.deleteDoc)void dep.deleteDoc(D(ACOES+'/'+id)).catch(()=>{});
   return;
  }
  if(processados.has(id))return;processados.add(id);
  try{
   const c=ctl(),t=c?.token?.(String(cmd.personagemId||''))||null,o=objeto(cmd.objetoId);
   if(win.mesaJogoPausadoV214?.())throw Error('Jogo pausado pelo mestre.');
   if(!t)throw Error('Personagem não está no mapa.');
   if(String(t.donoUid||'')!==String(cmd.donoUid||''))throw Error('Pedido de quem não controla o personagem.');
   if(!o)throw Error('Objeto não encontrado.');
   const {W,H}=dims();if(!(cmd.acao==='levantar'&&String(cmd.alvoId)===String(t.id))&&distanciaObjeto(t,o,W,H)>ALCANCE_M+.6)throw Error('Longe demais do objeto.');
   if(!['alternar','teste','pegar','chave','quebrar','deitar','levantar'].includes(cmd.acao))throw Error('Pedido inválido.');
   const c2={...cmd,nome:limpaNome(t.nome||cmd.nome)};
   if(cmd.acao==='pegar')await aplicarPegar(c2);else if(['deitar','levantar'].includes(cmd.acao))await aplicarRepouso(c2);else await aplicarAgora(c2);
   await dep.setDoc(D(ACOES+'/'+id),clean({...cmd,status:'done',concluidoEm:Date.now()}));
  }catch(e){console.warn('[Objetos] pedido recusado',e?.message||e);try{await dep.setDoc(D(ACOES+'/'+id),clean({...cmd,status:'rejected',message:String(e?.message||e),concluidoEm:Date.now()}));}catch(f){console.warn('[Objetos] confirmação',f);}}
  finally{setTimeout(()=>{processados.delete(id);if(dep.deleteDoc)void dep.deleteDoc(D(ACOES+'/'+id)).catch(()=>{});},60000);}
 }
 // arma derrubada (efeito Desarmar): o mestre põe a arma no chão, perto de quem a perdeu
 async function armasNoChao(){
  if(!ehMestre()||!saude?.actors||!cena||!mapa?.mapId||String(cena.mapId||'')!==String(mapa.mapId))return;
  for(const [id,at] of Object.entries(saude.actors)){
   const ac=at?.combateLab?.armaCaida;if(!ac||ac.objeto||armasFeitas.has(id+':'+ac.ts))continue;
   const t=ctl()?.token?.(id);if(!t||String(t.mapaId||mapa.mapId)!==String(mapa.mapId))continue;
   armasFeitas.add(id+':'+ac.ts);
   try{await dep.runTransaction(dep.db,async tx=>{
    const hs=await tx.get(D(HEALTH)),hp=hs.exists()?hs.data():null,cur=hp?.actors?.[id]?.combateLab?.armaCaida;if(!cur||cur.objeto)return;
    const s=await tx.get(D(SCENE)),c=s.exists()?s.data():null;if(!c||String(c.mapId||'')!==String(mapa.mapId))return;
    const {W,H}=dims(),ang=Math.random()*Math.PI*2,dm=(Number(t.diametroM)||1)/2+.5,x=Math.max(.3,Math.min(27.7,Number(t.x)+Math.cos(ang)*dm*28/W)),y=Math.max(.3,Math.min(13.7,Number(t.y)+Math.sin(ang)*dm*14/H));
    const oid='chao_arma_'+novoUid(),en={uid:oid,tipo:'item',idBanco:String(cur.idBanco||''),nome:String(cur.nome||'Arma'),imagem:String(cur.imagem||''),armaCaida:{dono:id,key:String(cur.key||''),nome:String(cur.nome||''),donoNome:limpaNome(t.nome)}};
    const o={id:oid,nome:'🗡️ '+en.nome+' (no chão)',x,y,larguraM:.8,alturaM:.4,angulo:Math.round(ang*57.3),camada:1,bloqueiaMovimento:false,bloqueiaVisao:false,imagem:en.imagem||ARMA_IMG,itemSolto:clean(en)};
    const actors={...hp.actors,[id]:{...hp.actors[id],combateLab:{...hp.actors[id].combateLab,armaCaida:{...cur,objeto:oid}}}};
    tx.set(D(SCENE),clean({...c,objects:[...(c.objects||[]),o]}));tx.set(D(HEALTH),clean({...hp,actors}));
   });}catch(e){console.warn('[Objetos] arma no chão',e);armasFeitas.delete(id+':'+ac.ts);}
  }
 }

 // ------------------------------------------------------------ assinaturas
 function assinar(){
  parar.forEach(f=>{try{f();}catch(_){}});parar=[];
  parar.push(dep.onSnapshot(D(SCENE),s=>{cena=s.exists()?s.data():null;chave='';desenhar();void armasNoChao();},e=>console.warn('[Objetos] cena',e)));
  parar.push(dep.onSnapshot(D(MAP),s=>{mapa=s.exists()?s.data():null;chave='';desenhar();},e=>console.warn('[Objetos] mapa',e)));
  if(ehMestre()){
   parar.push(dep.onSnapshot(dep.collection(dep.db,...ACOES.split('/')),q=>{q.forEach(d=>{void processar(d.id,d.data()||{});});},e=>console.warn('[Objetos] pedidos',e)));
   parar.push(dep.onSnapshot(D(HEALTH),s=>{saude=s.exists()?s.data():null;void armasNoChao();},e=>console.warn('[Objetos] saúde',e)));
  }
 }
 root.addEventListener('pointerdown',e=>{if(balao&&!balao.hidden&&!balao.contains(e.target)&&!e.target.closest?.('.mo-ic,.mo-vizinho,#moSoltar')&&!colocando)fechar();});
 root.addEventListener('keydown',e=>{if(e.key==='Escape'){if(colocando){colocando=null;board()?.classList.remove('mo-colocando');desenhar();}else if(balao&&!balao.hidden)fechar();}});
 const vigia=setInterval(()=>{
  try{
   if(!uid())return;const k=uid()+'|'+ehMestre();if(assinado!==k){assinado=k;assinar();}
   desenhar();if(abertoId||soltarAberto)desenharBalao();
  }catch(e){console.warn('[Objetos]',e);}
 },700);
 return {abrir,fechar,soltarNoChao,_objetoSobPonto:e=>objetoSobPonto(e,board()),parar:()=>{clearInterval(vigia);win.removeEventListener('resize',aoRedimensionar);parar.forEach(f=>{try{f();}catch(_){}});}};
}
