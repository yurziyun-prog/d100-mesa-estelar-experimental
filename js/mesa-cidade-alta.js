// Mesa Estelar v145 — A subida para a Cidade Superior (Cidade Alta) de Véspera.
//
// Uma vez, na conta do mestre: cria a Escadaria da Cidade Alta (com névoa de guerra), a Praça da Cidade Superior,
// O Cálice de Cristal (taverna dos ricos), a Câmara do Conselho em anfiteatro e a Residência de Ilü-Mus-Ki
// (usa os mapas dos cenários que já existirem, com cópia de segurança), liga tudo (Ruas Escavadas → Escadaria →
// Praça → Câmara, Residência, Cálice, Hospital, Porto Alto), põe os guardas do portão e, se existirem no banco,
// Nilo na escadaria, Ilü-Mus-Ki no átrio e Maelia Varen na Câmara. Cria a “Carta de recomendação de Darek Sol”.
// No portão: quem chega perto vê “🛂 Falar com a guarda”: mostrar a carta, conversar, enganar ou subornar
// (uma tentativa de cada por dia). O mestre também pode simplesmente liberar. Módulo à parte.

import {gerarEscadariaAlta,gerarPracaAlta,gerarTavernaAlta,gerarCamara,gerarPalacioMusk,ID_ESCADARIA,ID_PRACA_ALTA,ID_TAVERNA_ALTA,ID_CAMARA,ID_PALACIO} from './mesa-cidade-alta-mapas.js?v=151';
import {cenaDoEstado,LIMITE_CENA} from './mesa-mapas-ui.js?v=141';
import {afastarNaBorda,pontoDeBorda,livrePerto} from './mesa-ligacoes.js?v=154';
import {gerarNpc} from './mesa-diretor-dados.js?v=108';
import {renderizarMiniatura,specDeNpc,MARCA_MINI} from './mesa-miniaturas.js?v=194';
import {classificarTeste} from './nova-regras.js?v=46';
import {NOTA_IMG,novoUid} from './mesa-objetos.js?v=155';

const clean=v=>JSON.parse(JSON.stringify(v??null));
const sem=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const limpa=n=>String(n||'Alguém').replace(/^(NPC|Monstro|PJ|PM|Criatura)\s*[·:-]\s*/i,'');
const POS='combatesAtivos/mapaMesaSyncDireta/posicoes',HIST='combatesAtivos/mapaMesaSyncHistorico',LIGACOES='combatesAtivos/mesaLigacoes';
export const ESTADO='combatesAtivos/mesaPortaoAlto',PEDIDOS=ESTADO+'/acoes',ALCANCE=3.6,CARTA_ID='carta_darek_sol';
export const TENTATIVAS={
 conversar:{rotulo:'🗣️ Conversar',pericia:'Influência',nomes:['influência','influencia'],contra:30},
 enganar:{rotulo:'🤥 Enganar',pericia:'Enganação',nomes:['enganação','enganacao'],contra:35},
 subornar:{rotulo:'💰 Subornar (30)',pericia:'Comércio',nomes:['comércio','comercio'],contra:25,custo:30}
};
export const chanceContra=(valor,contra)=>Math.max(5,Math.min(95,Math.round(Number(valor)||0)+50-Number(contra||0)));
export const temCarta=(inv={})=>['equipado','bolso','mochila'].some(k=>(inv?.[k]||[]).some(i=>i&&(String(i.id||i.idBanco||'')===CARTA_ID||/carta/.test(sem(i.nome))&&/(darek|dark|derek)\s*sol/.test(sem(i.nome+' '+(i.descricao||''))))));
export function ligar(ligs,a,pa,b,pb){
 const resto=(ligs||[]).filter(l=>!((String(l.a?.mapa)===a&&String(l.b?.mapa)===b)||(String(l.a?.mapa)===b&&String(l.b?.mapa)===a)));
 return [...resto,{id:'lig_v145_'+a+'_'+b,a:{mapa:a,x:+pa.x.toFixed(2),y:+pa.y.toFixed(2)},b:{mapa:b,x:+pb.x.toFixed(2),y:+pb.y.toFixed(2)},tipo:'porta',auto:true}];
}
export function acharCenario(cens=[],re,{local=null}={}){return cens.find(c=>re.test(sem(c.nome))&&(!local||local.test(sem([c.local,c.nome,c.descricaoJogadores].join(' ')))))||null;}

export function instalarCidadeAlta(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const D=p=>dep.doc(dep.db,p);
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const uid=()=>{try{return String(dep.uid?.()||'');}catch(_){return '';}};
 const ctl=()=>{try{return dep.controller?.()||null;}catch(_){return null;}};
 const toast=(t,ms=16000)=>{const n=root.createElement('div');n.textContent=t;n.style.cssText='position:fixed;left:16px;bottom:150px;z-index:9999;background:#1d2a44;border:1px solid #8ee7ff;color:#e8eefc;padding:9px 14px;border-radius:12px;font:600 13px Segoe UI,Arial,sans-serif;max-width:640px;max-height:40vh;overflow:auto';root.body.append(n);setTimeout(()=>n.remove(),ms);};
 let feito=false,rodando=false,tentativas=0,estado={},parar=[],assinado='',balao=null,aberto='',botao=null,ocupado=false;const processados=new Set();

 // ------------------------------------------------------------ montagem (uma vez)
 async function salvar(id,nome,state,ajustar=c=>c){
  let final=null;await win.mesaMapasV110_.salvar({id,nome,state,cenaDe:mid=>{const c=ajustar(cenaDoEstado(state,mid));final=c;return JSON.stringify(c).length<=LIMITE_CENA?c:null;}});return final;
 }
 async function backup(id){
  try{const m=await dep.getDoc(D('mapas/'+id));if(m.exists())await dep.setDoc(D('combatesAtivos/backupMapa_'+id+'_v145'),clean({em:new Date().toISOString(),mapa:m.data()}));}catch(e){console.warn('[Cidade Alta] backup',e);}
  try{const s=await dep.getDoc(D('combatesAtivos/mapaMesaSyncCena_'+encodeURIComponent(id)));if(s.exists()&&JSON.stringify(s.data()).length<900000)await dep.setDoc(D('combatesAtivos/backupCena_'+id+'_v145'),clean({em:new Date().toISOString(),cena:s.data()}));}catch(_){}
 }
 const placa=(x,y,titulo,texto)=>({id:'chao_'+novoUid(),nome:'📜 '+titulo,x,y,larguraM:.5,alturaM:.5,angulo:0,camada:1,bloqueiaMovimento:false,bloqueiaVisao:false,imagem:NOTA_IMG,itemSolto:{uid:novoUid(),tipo:'nota',nome:titulo,texto}});
 const comPlacas=lista=>c=>({...c,objects:[...(c.objects||[]),...lista]});
 async function modeloGuarda(){
  const npcs=dep.npcs?.()||[],id='guarda_cidade_superior';let m=npcs.find(n=>String(n.id)===id);if(m)return m;
  const bruto={...gerarNpc({especie:'humano',papel:'guarda',rnd:(s=>()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296))(1457)}),id,nome:'Guarda da Cidade Superior',carreira:'Guarda urbana',conceito:'Guarda do portão da Cidade Superior',
   descricao:'Guarda da Cidade Superior de Véspera: armadura polida, lança de choque e cara de quem já viu muita gente da Cidade Baixa tentar subir sem permissão.'};
  try{m=dep.normalizar?dep.normalizar('npcs',bruto):bruto;}catch(_){m=bruto;}Object.assign(m,{id,nome:'Guarda da Cidade Superior'});
  try{const sp=specDeNpc(m),blob=new Blob([renderizarMiniatura(sp)],{type:'image/svg+xml'});const snap=await dep.uploadBytes(dep.ref(dep.storage,`personagens/${uid()}/miniaturas/npcs-${id}.svg`),blob,{contentType:'image/svg+xml',cacheControl:'public,max-age=31536000'});
   m.miniatura={url:(await dep.getDownloadURL(snap.ref))+MARCA_MINI,spec:sp,tipo:'montada',atualizadoEm:new Date().toISOString()};}catch(e){console.warn('[Cidade Alta] miniatura',e);}
  await dep.setDoc(D('npcs/'+id),clean(m));try{npcs.push(m);}catch(_){}return m;
 }
 async function colocar(npc,mapId,p,{id=null,nome=null,se=true}={}){
  if(!npc||!se)return false;const tid=encodeURIComponent(id||('syncnpc:'+npc.id)),todos=ctl()?.todosTokens?.()||[];
  if(todos.some(t=>String(t.id)===tid))return false;
  await dep.setDoc(D(POS+'/'+tid),clean({nome:nome||String(npc.nome||npc.id),imagem:String(npc.miniatura?.url||npc.imagem||''),donoUid:'',x:+Number(p.x).toFixed(3),y:+Number(p.y).toFixed(3),revision:0,facing:Math.PI/2,camada:3,mapaId:String(mapId),diametroM:1}));return true;
 }
 async function montar(){
  if(feito||rodando||!ehMestre())return;
  const objs=dep.objetos?.()||[],mapas=dep.mapas?.()||[];
  if(!win.mesaMapasV110_?.salvar||!mapas.length||!ctl()?.todosTokens||!(dep.cenarios?.()||[]).length)return;
  if(!['pk_fonte_praca','pk_portao_vespera','pk_escada','pk_mesa_reuniao'].every(i=>objs.some(o=>String(o.id)===i)))return;
  const flag=D('configuracoes/cidadeAltaV145');
  try{if((await dep.getDoc(flag)).exists()){feito=true;return;}if(!(await dep.getDoc(D('configuracoes/vesperaV138'))).exists())return;}catch(_){return;}
  if(++tentativas>2){feito=true;return;}
  rodando=true;const feitos=[],erros=[];
  try{
   await dep.setDoc(flag,{iniciadoEm:new Date().toISOString()});
   const cens=dep.cenarios?.()||[],SUP=/cidade (alta|superior)|distrito civico|alto de vespera/;
   const tenta=async(n,f)=>{try{const r=await f();if(r!==false)feitos.push(n);return r;}catch(e){console.warn('[Cidade Alta]',n,e);erros.push(n+': '+(e?.message||e));return false;}};
   // 1) mapas
   const stE=gerarEscadariaAlta({objetos:objs}),meta=stE.escadariaAltaV145;
   await tenta('Escadaria da Cidade Alta (com névoa)',async()=>{await salvar(ID_ESCADARIA,'Escadaria da Cidade Alta',stE);await dep.setDoc(D('mapas/'+ID_ESCADARIA),{nevoaV145:true,escadariaAltaV145:meta},{merge:true});try{const mm=(dep.mapas?.()||[]).find(x=>String(x.id)===ID_ESCADARIA);if(mm)Object.assign(mm,{nevoaV145:true,escadariaAltaV145:meta});}catch(_){}await dep.setDoc(D('combatesAtivos/mesaNevoa'),{mapas:{[ID_ESCADARIA]:true}},{merge:true});});
   const stP=gerarPracaAlta({objetos:objs}),saidasP=stP.pracaAltaV145.saidas;
   await tenta('Praça da Cidade Superior',()=>salvar(ID_PRACA_ALTA,'Praça da Cidade Superior',stP,comPlacas([
    placa(14.6,4.6,'Placa da estátua de Valloton','A VALLOTON, O PACIFICADOR — que em hora de fúria trouxe a Véspera a paz e a lei. Do Conselho e das famílias da Cidade Superior.'),
    placa(14,2.4,'Inscrição da estátua de Vaelkor','CASA VAELKOR — Senhores de Calico, reconhecidos pelo Império. Véspera honra seus protetores.')])));
   const stT=gerarTavernaAlta({objetos:objs});await tenta('O Cálice de Cristal (taverna da Cidade Superior)',()=>salvar(ID_TAVERNA_ALTA,'O Cálice de Cristal',stT));
   const cCam=acharCenario(cens,/camara|conselho|senado|assembleia/),idCam=cCam?.mapaId&&mapas.some(m=>String(m.id)===String(cCam.mapaId))?String(cCam.mapaId):ID_CAMARA;
   const stC=gerarCamara({objetos:objs,nome:cCam?.nome||'Câmara do Conselho de Véspera'});
   await tenta(`${cCam?.nome||'Câmara do Conselho'} (anfiteatro)`,async()=>{if(idCam!==ID_CAMARA)await backup(idCam);await salvar(idCam,cCam?.nome||'Câmara do Conselho de Véspera',stC,comPlacas([placa(14,1.2,'Placa da reforma de Valloton','Por obra de Valloton, metade destas cadeiras pertence aos eleitos da Cidade Baixa e metade às famílias da Cidade Superior. Que o Conselho fale por toda Véspera.')]));});
   const cPal=acharCenario(cens,/ilu|mus.?ki|musk|residencia/),idPal=cPal?.mapaId&&mapas.some(m=>String(m.id)===String(cPal.mapaId))&&/ilu|mus.?ki|musk/.test(sem(cPal.nome+' '+cPal.local+' '+cPal.descricaoJogadores))?String(cPal.mapaId):ID_PALACIO;
   const stM=gerarPalacioMusk({objetos:objs,nome:idPal!==ID_PALACIO?cPal.nome:'Residência de Ilü-Mus-Ki'});
   await tenta('Residência de Ilü-Mus-Ki (dois andares, átrio, piscina)',async()=>{if(idPal!==ID_PALACIO)await backup(idPal);await salvar(idPal,stM.name,stM);});
   // 2) ligações
   try{const s=await dep.getDoc(D(LIGACOES));let ligs=s.exists()?(s.data().ligacoes||[]):[];
    const usados=id=>ligs.flatMap(l=>[l.a,l.b].filter(e=>String(e?.mapa)===String(id)));
    const borda=(id,lado)=>afastarNaBorda(pontoDeBorda(0,lado),usados(id));
    const ruas=mapas.find(m=>String(m.id)==='cenario_c002'||m.ruasV138||/ruas escavadas/i.test(m.nome||''));
    if(ruas)ligs=ligar(ligs,String(ruas.id),borda(String(ruas.id),'norte'),ID_ESCADARIA,meta.entrada);
    ligs=ligar(ligs,ID_ESCADARIA,meta.saidaAlta,ID_PRACA_ALTA,saidasP.escadaria);
    ligs=ligar(ligs,ID_PRACA_ALTA,saidasP.camara,idCam,stC.camaraV145.saida);
    ligs=ligar(ligs,ID_PRACA_ALTA,saidasP.palacio,idPal,stM.palacioMuskV145.saida);
    ligs=ligar(ligs,ID_PRACA_ALTA,saidasP.taverna,ID_TAVERNA_ALTA,stT.tavernaAltaV145.saida);
    const porto=mapas.find(m=>String(m.id)==='cenario_c026')||(()=>{const c=acharCenario(cens,/porto/,{local:SUP});return c?mapas.find(m=>String(m.id)===String(c.mapaId)):null;})();
    if(porto)ligs=ligar(ligs,ID_PRACA_ALTA,saidasP.porto,String(porto.id),borda(String(porto.id),'norte'));
    const hc=acharCenario(cens,/hospital|clinica|enfermaria/,{local:SUP})||acharCenario(cens,/hospital/),hosp=hc?mapas.find(m=>String(m.id)===String(hc.mapaId)):null;
    if(hosp)ligs=ligar(ligs,ID_PRACA_ALTA,saidasP.hospital,String(hosp.id),borda(String(hosp.id),'leste'));
    await dep.setDoc(D(LIGACOES),clean({ligacoes:ligs,atualizadoEm:Date.now(),ladosV138:true}));feitos.push('ligações (Ruas Escavadas → Escadaria → Praça → Câmara, Residência, Cálice'+(porto?', Porto Alto':'')+(hosp?', Hospital':'')+')');
   }catch(e){console.warn('[Cidade Alta] ligações',e);erros.push('ligações: '+(e?.message||e));}
   // 3) gente: guardas no portão, Nilo, Ilü-Mus-Ki, Maelia Varen
   try{const g=await modeloGuarda();for(const [k,p] of meta.guardas.entries())await colocar(g,ID_ESCADARIA,p,{id:'syncnpc:guarda_cidade_superior~'+(k+1),nome:'Guarda da Cidade Superior '+(k+1)});}catch(e){console.warn('[Cidade Alta] guardas',e);}
   const npcs=dep.npcs?.()||[],acha=re=>npcs.find(n=>re.test(sem(n.nome)));
   try{if(await colocar(acha(/^nilo\b|\bnilo\b/),ID_ESCADARIA,meta.nino))feitos.push('Nilo escondido num trecho da escadaria');}catch(_){}
   try{if(await colocar(acha(/ilu.?mus|mus.?ki/),idPal,stM.palacioMuskV145.ilu))feitos.push('Ilü-Mus-Ki no átrio');}catch(_){}
   try{if(await colocar(acha(/maelia/),idCam,stC.camaraV145.chefe))feitos.push('Maelia Varen na Câmara');}catch(_){}
   // 4) a carta de Darek Sol (o mestre entrega no inventário de quem a recebeu)
   try{const itens=dep.itens?.()||[];if(!itens.some(i=>String(i.id)===CARTA_ID)){const it={id:CARTA_ID,nome:'Carta de recomendação de Darek Sol',categoria:'Documento',peso:0,preco:0,pa:0,pv:1,qualidade:'Básica',disponivelCampanha:false,material:'Papel',imagem:NOTA_IMG,
     descricao:'Carta lacrada com o selo da Guarda de Véspera. Darek Sol recomenda o portador e seus companheiros ao portão da Cidade Superior, depois da luta na arena.'};await dep.setDoc(D('itens/'+CARTA_ID),clean(it),{merge:true});try{itens.push(it);}catch(_){}feitos.push('item “Carta de recomendação de Darek Sol” no banco');}}catch(e){console.warn('[Cidade Alta] carta',e);}
   await dep.setDoc(flag,{em:new Date().toISOString(),feitos,erros});feito=true;
   toast(`🏛️ Cidade Superior pronta: ${feitos.join(' · ')}.${erros.length?' ⚠️ '+erros.join(' · '):''}`);
  }catch(e){console.warn('[Cidade Alta]',e);}
  finally{rodando=false;}
 }

 // ------------------------------------------------------------ portão (todos veem; o mestre aplica)
 const mapaAtual=()=>{try{return String(ctl()?.mapaAtual?.()||'');}catch(_){return '';}};
 const meta=()=>(dep.mapas?.()||[]).find(m=>String(m.id)===mapaAtual())?.escadariaAltaV145||null;
 const dims=()=>{try{return ctl()?.dimsAtual?.()||{W:56,H:28};}catch(_){return {W:56,H:28};}};
 const dist=(a,b)=>{const {W,H}=dims();return Math.hypot((a.x-b.x)*W/28,(a.y-b.y)*H/14);};
 function ator(){try{const c=ctl(),t=c?.ator?.();return t&&c.controla?.(t)?t:null;}catch(_){return null;}}
 const ehPC=t=>!!t&&!decodeURIComponent(String(t.id||'')).startsWith('sync');
 const dia=()=>{try{return Math.floor(Number(win.mesaRelogio?.agora?.()||Date.now())/86400000);}catch(_){return 0;}};
 const CSS=`#caBotao{position:absolute;z-index:34;transform:translate(-50%,-190%);height:28px;padding:0 10px;border-radius:999px;border:1px solid #c9a85a;background:rgba(32,26,10,.94);color:#ffe9b8;font:600 12px 'Segoe UI',Arial,sans-serif;cursor:pointer;white-space:nowrap}
#caBalao{position:fixed;z-index:9002;width:min(330px,calc(100vw - 24px));padding:10px 12px;border-radius:12px;background:rgba(9,15,29,.97);border:1px solid #c9a85a;color:#e8eefc;font:13px 'Segoe UI',Arial,sans-serif;box-shadow:0 10px 28px rgba(0,0,0,.55)}
#caBalao[hidden]{display:none}#caBalao h4{margin:0 0 6px;display:flex;gap:6px;align-items:center;color:#ffd98a;font-size:14px}#caBalao h4 span{flex:1}
#caBalao h4 button{width:24px;height:24px;border-radius:7px;border:1px solid #3b5878;background:#16233a;color:#fff;cursor:pointer;padding:0}
#caBalao .ca-fala{font-style:italic;color:#ffe9b8;margin:4px 0 8px}#caBalao .ca-b{display:block;width:100%;margin:4px 0;min-height:30px;padding:4px 10px;border-radius:9px;border:1px solid #2f4664;background:rgba(255,255,255,.05);color:#e8eefc;cursor:pointer;font:inherit;text-align:left}
#caBalao .ca-b:disabled{opacity:.45;cursor:not-allowed}#caBalao .ca-info{color:#9fb3cc;font-size:12px;margin:4px 0}`;
 if(!root.getElementById('caCss')){const st=root.createElement('style');st.id='caCss';st.textContent=CSS;root.head.append(st);}
 const fora=(t,m)=>Number(t.x)<Number(m.portao.x);
 function desenharBotao(){
  const b=root.getElementById('novaSyncBoard'),a=ator(),m=meta();let mostrar=null;
  if(b&&a&&ehPC(a)&&m&&String(a.mapaId||mapaAtual())===mapaAtual()){
   if(fora(a,m)&&dist(a,m.portao)<=ALCANCE)mostrar={...m.portao,txt:'🛂 Falar com a guarda'};
   else if(!fora(a,m)&&dist(a,m.portao)<=ALCANCE)mostrar={...m.portao,txt:'🚪 Descer para a Cidade Baixa'};
  }
  if(!mostrar){botao?.remove();botao=null;if(aberto)fechar();return;}
  if(!botao||botao.parentElement!==b){botao?.remove();botao=root.createElement('button');botao.type='button';botao.id='caBotao';botao.addEventListener('pointerdown',e=>e.stopPropagation());botao.addEventListener('click',()=>abrir());b.append(botao);}
  if(botao.textContent!==mostrar.txt)botao.textContent=mostrar.txt;botao.style.left=mostrar.x/28*100+'%';botao.style.top=mostrar.y/14*100+'%';
  if(aberto)desenharBalao();
 }
 function abrir(){
  const a=ator();if(!a)return;const m=meta();if(m&&!fora(a,m)){void pedir('descer');return;}
  aberto=String(a.id);if(!balao){balao=root.createElement('div');balao.id='caBalao';balao.hidden=true;root.body.append(balao);balao.addEventListener('pointerdown',e=>e.stopPropagation());balao.addEventListener('click',aoClicar);}
  balao.hidden=false;balao.dataset.h='';desenharBalao();const r=botao?.getBoundingClientRect();if(r){balao.style.left=Math.max(8,Math.min(win.innerWidth-340,r.left))+'px';balao.style.top=Math.max(8,Math.min(win.innerHeight-330,r.bottom+8))+'px';}
 }
 function fechar(){aberto='';if(balao)balao.hidden=true;}
 // v146: clicar num guarda do portão (fora de combate) abre a conversa do portão
 const dialogoAnteriorCA=win.mesaDialogoNPC_;
 win.mesaDialogoNPC_=(id,atorId)=>{
  try{if(/guarda_cidade_superior/.test(decodeURIComponent(String(id)))){const a=ator(),m=meta();
   if(a&&ehPC(a)&&m){if(dist(a,m.portao)>ALCANCE){const n=root.createElement('div');n.textContent='🚶 Chegue perto do portão para falar com a guarda.';n.style.cssText='position:fixed;left:50%;top:84px;transform:translateX(-50%);z-index:9999;background:#201a0a;border:1px solid #c9a85a;color:#ffe9b8;padding:8px 14px;border-radius:12px;font:600 13px Segoe UI,Arial,sans-serif;pointer-events:none';root.body.append(n);setTimeout(()=>n.remove(),3200);return true;}
    abrir();return true;}}}catch(e){console.warn('[Cidade Alta] diálogo',e);}
  return typeof dialogoAnteriorCA==='function'?dialogoAnteriorCA(id,atorId):false;
 };
 function desenharBalao(){
  if(!balao||balao.hidden)return;const a=ator();if(!a||String(a.id)!==aberto){fechar();return;}
  const e=estado?.[a.id]?.dia===dia()?estado[a.id]:{};
  let h=`<h4>🛂 <span>Portão da Cidade Superior</span><button type="button" data-x title="Fechar">✕</button></h4><div class="ca-fala">${esc(e.fala||'— Alto. A Cidade Superior não é para qualquer um. Quem são vocês e o que querem lá em cima?')}</div>`;
  h+=`<button type="button" class="ca-b" data-acao="carta">📜 Mostrar a carta de Darek Sol</button>`;
  for(const [k,t] of Object.entries(TENTATIVAS))h+=`<button type="button" class="ca-b" data-acao="t:${k}" ${e.tentou?.[k]||e.recusado?'disabled':''} title="${esc(t.pericia)} · uma tentativa por dia">${t.rotulo} · ${esc(t.pericia)}${e.tentou?.[k]?' · '+esc(e.tentou[k]):''}</button>`;
  if(ehMestre())h+=`<button type="button" class="ca-b" data-acao="liberar">✔️ (mestre) Liberar a passagem</button>`;
  if(e.ultima)h+=`<div class="ca-info">${esc(e.ultima)}</div>`;if(ocupado)h+='<div class="ca-info">⏳ …</div>';
  if(balao.dataset.h!==h){balao.innerHTML=h;balao.dataset.h=h;}
 }
 async function aoClicar(ev){const b=ev.target.closest('button');if(!b)return;if(b.dataset.x!==undefined){fechar();return;}if(b.dataset.acao)await pedir(b.dataset.acao);}
 async function pedir(acao){
  const a=ator();if(!a||ocupado)return;ocupado=true;desenharBalao();
  const cmd={donoUid:uid(),personagemId:decodeURIComponent(String(a.id)),tokenId:String(a.id),mapa:mapaAtual(),acao,criadoEm:Date.now()};
  try{if(ehMestre())await processar('local'+Date.now(),cmd);else await dep.setDoc(D(PEDIDOS+'/c'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)),cmd);}catch(e){console.warn('[Cidade Alta]',e);}
  finally{setTimeout(()=>{ocupado=false;if(balao)balao.dataset.h='';desenharBalao();},ehMestre()?50:900);}
 }
 async function registrar(msg){try{await dep.runTransaction(dep.db,async tx=>{const s=await tx.get(D(HIST)),h=s.exists()?s.data():{entries:[],revision:0};tx.set(D(HIST),clean({entries:[...(h.entries||[]),{id:'ca:'+Date.now().toString(36),ts:Date.now(),actorUid:'',targetUid:'',message:msg}].slice(-120),revision:Number(h.revision||0)+1}));});}catch(_){}}
 async function mover(tokenId,p,mapId){
  const ocup=(ctl()?.todosTokens?.()||[]).filter(t=>String(t.mapaId||'')===mapId&&String(t.id)!==tokenId).map(t=>({x:t.x,y:t.y,larguraM:1,alturaM:1,bloqueiaMovimento:true}));
  const m=(dep.mapas?.()||[]).find(x=>String(x.id)===mapId),q=livrePerto(ocup,p.x,p.y,Number(m?.larguraM)||56,Number(m?.alturaM)||28,.55);
  await dep.runTransaction(dep.db,async tx=>{const r=D(POS+'/'+tokenId),s=await tx.get(r);if(!s.exists())throw Error('Personagem não está no mapa.');tx.set(r,{...s.data(),x:+q.x.toFixed(3),y:+q.y.toFixed(3),revision:Number(s.data().revision||0)+1});});
 }
 async function salvarEstado(id,e){estado={...estado,[id]:e};await dep.setDoc(D(ESTADO),clean({[id]:e,atualizadoEm:Date.now()}),{merge:true});}
 async function processar(pid,cmd){
  if(processados.has(pid))return;processados.add(pid);
  const tokenId=String(cmd.tokenId||encodeURIComponent(String(cmd.personagemId||'')));
  try{
   const t=(ctl()?.todosTokens?.()||[]).find(x=>String(x.id)===tokenId);if(!t)throw Error('Personagem não está no mapa.');
   if(String(t.donoUid||'')!==String(cmd.donoUid||'')&&!ehMestre())throw Error('Pedido de quem não controla o personagem.');
   const mapId=String(t.mapaId||cmd.mapa||''),m=(dep.mapas?.()||[]).find(x=>String(x.id)===mapId)?.escadariaAltaV145;if(!m)throw Error('Fora da escadaria.');
   const nome=limpa(t.nome),hoje=dia();let e=estado?.[tokenId]?.dia===hoje?{...estado[tokenId]}:{dia:hoje,tentou:{}};
   if(cmd.acao==='descer'){await mover(tokenId,m.fora,mapId);await registrar(`🚪 ${nome} desce pelo portão da Cidade Superior.`);return;}
   if(dist(t,m.portao)>ALCANCE+1.5)throw Error('Longe do portão.');
   const passar=async(msg)=>{e={...e,liberado:true,fala:'— Pode passar. E se comporte lá em cima.',ultima:msg};await salvarEstado(tokenId,e);await mover(tokenId,m.dentro,mapId);await registrar(`🛂 ${nome}: ${msg}`);};
   if(cmd.acao==='liberar'){if(!ehMestre())throw Error('Só o mestre.');await passar('o mestre liberou a passagem.');return;}
   if(cmd.acao==='carta'){
    let inv={};try{const s=await dep.getDoc(D('personagens/'+decodeURIComponent(tokenId)));inv=s.exists()?s.data().inventario||{}:{};}catch(_){}
    if(temCarta(inv)){await passar('mostrou a carta de Darek Sol; a guarda confere o selo e abre o portão.');return;}
    e={...e,fala:'— Carta? Que carta? Não vejo carta nenhuma.',ultima:'📜 Sem a carta no inventário (o mestre pode entregá-la ou liberar).'};await salvarEstado(tokenId,e);return;}
   if(cmd.acao.startsWith('t:')){
    const k=cmd.acao.slice(2),T=TENTATIVAS[k];if(!T||e.tentou?.[k]||e.recusado)throw Error('Já tentou isso hoje.');
    const P=win.mesaPedagioV138_;if(!P)throw Error('Ponte de perícias indisponível.');
    if(T.custo){try{await P.cobrar(decodeURIComponent(tokenId),T.custo);}catch(err){e={...e,ultima:'💳 '+(err?.message||err)};await salvarEstado(tokenId,e);return;}}
    const valor=await P.pericia(t,T.nomes),chance=chanceContra(valor,T.contra),die=1+Math.floor(Math.random()*100),r=classificarTeste(chance,die),ok=r.grau==='Sucesso'||r.grau==='Crítico';
    e={...e,tentou:{...(e.tentou||{}),[k]:r.grau},ultima:`🎲 ${T.pericia} ${valor} (chance ${chance}%): ${die} → ${r.grau}`};
    if(ok){await passar(`${T.pericia.toLowerCase()} com a guarda: ${die}/${chance} → ${r.grau}. Passa.`);return;}
    if(r.grau==='Fiasco')e={...e,recusado:true,fala:k==='subornar'?'— Tentando comprar a guarda? Some daqui antes que eu te prenda.':'— Chega. Hoje você não sobe.'};
    else e={...e,fala:k==='subornar'?'O guarda embolsa o dinheiro e não sai do lugar. — Obrigado pela contribuição.':'— Não. Sem autorização, não passa.'};
    await salvarEstado(tokenId,e);await registrar(`🛂 ${nome} tenta ${T.pericia.toLowerCase()} com a guarda da Cidade Superior: ${die}/${chance} → ${r.grau}.`);return;}
  }catch(err){const e=estado?.[tokenId];if(e)try{await salvarEstado(tokenId,{...e,ultima:'⚠️ '+(err?.message||err)});}catch(_){}console.warn('[Cidade Alta]',err?.message||err);}
  finally{if(!String(pid).startsWith('local'))try{await dep.deleteDoc?.(D(PEDIDOS+'/'+pid));}catch(_){}}
 }
 function assinar(){
  parar.forEach(f=>{try{f();}catch(_){}});parar=[];
  parar.push(dep.onSnapshot(D(ESTADO),s=>{const v=s.exists()?s.data():{};delete v.atualizadoEm;estado=v;if(balao)balao.dataset.h='';desenharBalao();},()=>{}));
  if(ehMestre())parar.push(dep.onSnapshot(dep.collection(dep.db,...PEDIDOS.split('/')),q=>{q.forEach(d=>{void processar(d.id,d.data()||{});});},()=>{}));
 }
 const vigia=setInterval(()=>{try{if(!uid())return;const k=uid()+'|'+ehMestre();if(k!==assinado){assinado=k;assinar();}desenharBotao();}catch(e){console.warn('[Cidade Alta]',e);}},450);
 const vigiaMontar=setInterval(()=>{void montar().catch(e=>console.warn('[Cidade Alta]',e));},4000);
 win.mesaCidadeAlta={montar,processar};
 return {parar(){clearInterval(vigia);clearInterval(vigiaMontar);parar.forEach(f=>{try{f();}catch(_){}});}};
}
