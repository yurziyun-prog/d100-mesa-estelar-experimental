// Mesa Estelar v171 — Veículos e naves à venda (concessionária e estaleiro) + modelos no Banco.
//
// • Catálogo fixo aqui (o jogador não lê o banco de veículos/naves): preço, porte, ficha. As imagens são as peças
//   arte/pecas/veiculo-*.webp (vistas de cima, no tamanho real).
// • O mestre cadastra os modelos em Banco → Veículos / Naves (uma vez).
// • Comerciante com o ramo "🚗 Veículos" ou "🚀 Naves" abre a concessionária em vez da loja de itens. O jogador pede a
//   compra; o navegador do mestre confere os recursos, desconta e entrega o veículo (veiculosPossuidos / navesPossuidas)
//   com o personagem como proprietário. O aviso volta para o jogador.

import {PECAS} from './mesa-pecas-dados.js?v=171';
import {miniaturaDeItem} from './mesa-itens-mini.js?v=194';

const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clean=v=>JSON.parse(JSON.stringify(v??null));
export const ESTADO='combatesAtivos/mesaConcessionaria',PEDIDOS='combatesAtivos/mesaConcessionaria/acoes';
const img=n=>(PECAS.find(p=>p.id==='ia_veiculo_'+n.replace(/-/g,'_'))||{}).src||'';
const dim=n=>{const p=PECAS.find(p=>p.id==='ia_veiculo_'+n.replace(/-/g,'_'));return p?`${p.larguraM} × ${p.alturaM} m`:'';};
// [peça, nome, ícone, categoria/tipo, porte, preço, acesso, extra]
const V=[
 ['scooter-turquesa','Scooter turquesa','🛵','Gravítica pessoal','Pequeno',900,'Comum',{estruturaMax:10,movimento:16,capacidadeCargaKg:20,passageiros:1,energiaMax:25}],
 ['moto-vermelha','Moto gravítica vermelha','🏍️','Gravítica pessoal','Pequeno',1400,'Comum',{estruturaMax:14,movimento:20,capacidadeCargaKg:30,passageiros:2,energiaMax:35}],
 ['moto-violeta','Moto gravítica violeta','🏍️','Gravítica pessoal','Pequeno',1500,'Comum',{estruturaMax:14,movimento:20,capacidadeCargaKg:30,passageiros:2,energiaMax:35}],
 ['moto-perola','Moto gravítica pérola','🏍️','Gravítica pessoal','Pequeno',1700,'Comum',{estruturaMax:16,movimento:21,capacidadeCargaKg:35,passageiros:2,energiaMax:40}],
 ['coupe','Cupê flutuante','🚗','Aerocarro','Médio',3000,'Comum',{estruturaMax:24,movimento:16,capacidadeCargaKg:150,passageiros:2,energiaMax:60}],
 ['hovercar','Aerocarro de bolhas','🚗','Aerocarro','Médio',3200,'Comum',{estruturaMax:24,movimento:16,capacidadeCargaKg:160,passageiros:3,energiaMax:60}],
 ['sedan','Sedã flutuante','🚘','Aerocarro','Médio',3500,'Comum',{estruturaMax:28,movimento:15,capacidadeCargaKg:250,passageiros:4,energiaMax:70}],
 ['taxi-dourado','Táxi dourado','🚕','Aerocarro','Médio',3700,'Comum',{estruturaMax:28,movimento:15,capacidadeCargaKg:220,passageiros:4,energiaMax:70}],
 ['carro-turquesa','Carro turquesa de luxo','🚘','Aerocarro','Médio',4400,'Comum',{estruturaMax:30,movimento:17,capacidadeCargaKg:200,passageiros:4,energiaMax:80}],
 ['furgao','Furgão flutuante','🚐','Utilitário','Grande',4400,'Comum',{estruturaMax:36,movimento:13,capacidadeCargaKg:900,passageiros:3,energiaMax:80}],
 ['picape','Picape flutuante','🛻','Utilitário','Grande',4700,'Comum',{estruturaMax:38,movimento:14,capacidadeCargaKg:700,passageiros:2,energiaMax:80}],
 ['explorador','Rover explorador','🚙','Exploração','Grande',5000,'Comum',{estruturaMax:40,blindagem:3,movimento:12,capacidadeCargaKg:400,passageiros:4,energiaMax:90}],
 ['rover','Rover blindado das areias','🚙','Exploração','Grande',5600,'Comum',{estruturaMax:46,blindagem:5,movimento:11,capacidadeCargaKg:500,passageiros:5,energiaMax:100}],
 ['carro-esportivo','Carro esportivo','🏎️','Aerocarro','Médio',6500,'Comum',{estruturaMax:26,movimento:22,capacidadeCargaKg:80,passageiros:2,energiaMax:90}],
 ['passageiros','Micro-ônibus flutuante','🚌','Transporte','Grande',7500,'Comum',{estruturaMax:50,movimento:11,capacidadeCargaKg:600,passageiros:14,energiaMax:120}],
 ['limousine','Limusine flutuante','🚘','Aerocarro de luxo','Grande',9500,'Comum',{estruturaMax:34,movimento:15,capacidadeCargaKg:250,passageiros:6,energiaMax:100}]
];
const N=[
 ['batedora','Nave batedora','🛸','Exploração/Batedora','Pequena',18000,'Restrito',{classe:'Batedora',cascoMax:36,blindagem:2,escudoMax:10,energiaMax:70,combustivelMax:90,movimento:16,manobra:5,sensores:6,capacidadeCargaKg:600,tripulacaoMin:1,tripulacaoMax:2,passageiros:1,slotsArmas:1}],
 ['nave-batedora-azul','Nave batedora azul','🛸','Exploração/Batedora','Pequena',22000,'Restrito',{classe:'Batedora',cascoMax:40,blindagem:3,escudoMax:12,energiaMax:80,combustivelMax:100,movimento:17,manobra:5,sensores:6,capacidadeCargaKg:700,tripulacaoMin:1,tripulacaoMax:2,passageiros:2,slotsArmas:1}],
 ['shuttle','Ônibus espacial','🚀','Transporte','Pequena',26000,'Restrito',{classe:'Lançadeira',cascoMax:42,blindagem:2,escudoMax:12,energiaMax:70,combustivelMax:110,movimento:13,manobra:3,sensores:3,capacidadeCargaKg:1500,tripulacaoMin:1,tripulacaoMax:3,passageiros:10,slotsArmas:0}],
 ['nave-shuttle-turquesa','Ônibus espacial turquesa','🚀','Transporte','Pequena',30000,'Restrito',{classe:'Lançadeira',cascoMax:44,blindagem:3,escudoMax:14,energiaMax:75,combustivelMax:115,movimento:14,manobra:3,sensores:4,capacidadeCargaKg:1600,tripulacaoMin:1,tripulacaoMax:3,passageiros:10,slotsArmas:0}],
 ['disco','Disco voador','🛸','Passeio/Transporte','Pequena',36000,'Restrito',{classe:'Disco',cascoMax:48,blindagem:3,escudoMax:18,energiaMax:90,combustivelMax:110,movimento:14,manobra:6,sensores:5,capacidadeCargaKg:1200,tripulacaoMin:1,tripulacaoMax:4,passageiros:6,slotsArmas:1}],
 ['nave-interceptor','Interceptador','✈️','Militar/Caça','Pequena',45000,'Militar',{classe:'Interceptador',cascoMax:40,blindagem:5,escudoMax:20,energiaMax:100,combustivelMax:80,movimento:22,manobra:8,sensores:6,capacidadeCargaKg:150,tripulacaoMin:1,tripulacaoMax:1,passageiros:0,slotsArmas:3}],
 ['nave-disco-dourado','Disco dourado','🛸','Passeio de luxo','Pequena',55000,'Restrito',{classe:'Disco',cascoMax:50,blindagem:3,escudoMax:22,energiaMax:100,combustivelMax:120,movimento:15,manobra:6,sensores:5,capacidadeCargaKg:1000,tripulacaoMin:1,tripulacaoMax:4,passageiros:8,slotsArmas:1}],
 ['caca','Caça estelar','✈️','Militar/Caça','Pequena',60000,'Militar',{classe:'Caça',cascoMax:46,blindagem:6,escudoMax:22,energiaMax:110,combustivelMax:90,movimento:20,manobra:7,sensores:6,capacidadeCargaKg:200,tripulacaoMin:1,tripulacaoMax:2,passageiros:0,slotsArmas:4}],
 ['nave-prata-vermelha','Nave prata e vermelha','🚀','Multiuso','Média',75000,'Restrito',{classe:'Corredora',cascoMax:60,blindagem:4,escudoMax:24,energiaMax:120,combustivelMax:140,movimento:18,manobra:5,sensores:5,capacidadeCargaKg:2500,tripulacaoMin:1,tripulacaoMax:4,passageiros:4,slotsArmas:2}],
 ['cargueiro-leve','Cargueiro leve','🚀','Carga/Comercial','Média',85000,'Restrito',{classe:'Cargueiro',cascoMax:70,blindagem:4,escudoMax:18,energiaMax:120,combustivelMax:160,movimento:10,manobra:2,sensores:4,capacidadeCargaKg:9000,tripulacaoMin:2,tripulacaoMax:5,passageiros:4,slotsArmas:1}],
 ['exploracao','Nave de exploração','🛰️','Exploração','Média',100000,'Restrito',{classe:'Exploradora',cascoMax:72,blindagem:4,escudoMax:26,energiaMax:150,combustivelMax:220,movimento:12,manobra:3,sensores:9,capacidadeCargaKg:4000,tripulacaoMin:2,tripulacaoMax:6,passageiros:4,slotsArmas:1}],
 ['nave-exploradora-azul','Nave exploradora azul','🛰️','Exploração','Média',120000,'Restrito',{classe:'Exploradora',cascoMax:80,blindagem:5,escudoMax:30,energiaMax:170,combustivelMax:240,movimento:13,manobra:3,sensores:10,capacidadeCargaKg:5000,tripulacaoMin:2,tripulacaoMax:8,passageiros:6,slotsArmas:2}],
 ['transporte','Nave de transporte','🚀','Transporte de passageiros','Grande',150000,'Restrito',{classe:'Transporte',cascoMax:95,blindagem:5,escudoMax:30,energiaMax:180,combustivelMax:240,movimento:10,manobra:2,sensores:4,capacidadeCargaKg:8000,tripulacaoMin:3,tripulacaoMax:8,passageiros:40,slotsArmas:1}],
 ['cargueiro-pesado','Cargueiro pesado','🚀','Carga/Comercial','Grande',200000,'Restrito',{classe:'Cargueiro pesado',cascoMax:130,blindagem:7,escudoMax:30,energiaMax:200,combustivelMax:300,movimento:8,manobra:1,sensores:4,capacidadeCargaKg:40000,tripulacaoMin:3,tripulacaoMax:10,passageiros:6,slotsArmas:2}],
 ['nave-iate-violeta','Iate espacial violeta','🛳️','Luxo','Grande',240000,'Restrito',{classe:'Iate',cascoMax:90,blindagem:4,escudoMax:40,energiaMax:200,combustivelMax:260,movimento:14,manobra:4,sensores:6,capacidadeCargaKg:3000,tripulacaoMin:2,tripulacaoMax:8,passageiros:16,slotsArmas:1}],
 ['nave-cargueiro-dourado','Cargueiro dourado','🚀','Carga/Comercial','Grande',300000,'Restrito',{classe:'Cargueiro pesado',cascoMax:150,blindagem:8,escudoMax:40,energiaMax:240,combustivelMax:320,movimento:8,manobra:1,sensores:5,capacidadeCargaKg:55000,tripulacaoMin:4,tripulacaoMax:12,passageiros:8,slotsArmas:2}]
];
const idDe=p=>'ia_'+p.replace(/-/g,'_');
export const VEICULOS=V.map(([p,nome,icone,categoria,tamanho,preco,nivelAcesso,x])=>({id:idDe(p),nome,icone,categoria,tamanho,preco,nivelAcesso,vendavel:true,disponivelCampanha:true,blindagem:0,combustivelMax:0,
 descricao:`${nome}, flutuante, ${dim(p)}.`,imagem:img(p),dimensoes:dim(p),...x}));
export const NAVES=N.map(([p,nome,icone,tipo,porte,preco,nivelAcesso,x])=>({id:idDe(p),nome,icone,tipo,porte,preco,nivelAcesso,vendavel:true,disponivelCampanha:true,
 descricao:`${nome}, ${dim(p)}.`,imagem:img(p),dimensoes:dim(p),...x}));
// v193: montarias e companheiros à venda (mesmos ids dos modelos de companheiros da ficha)
const M=[
 ['galinha_domestica','Galinha doméstica','🐔','Animal','Galliforme doméstico','Minúsculo',12,'Comum',{pvMax:2,movimento:3,capacidadeCargaKg:0,montaria:false,combatente:false,controlavel:false,robotico:false,energiaMax:0,habilidadesTexto:'Faz barulho; pode denunciar a posição do dono em situações de furtividade.',descricao:'Uma galinha comum. Não concede bônus e sua principal importância é narrativa.'}],
 ['lobo_companheiro','Lobo companheiro','🐺','Animal','Canídeo','Médio',850,'Comum',{pvMax:12,movimento:6,capacidadeCargaKg:5,montaria:false,combatente:true,controlavel:true,robotico:false,energiaMax:0,habilidadesTexto:'Rastrear; faro aguçado; combate corpo a corpo.',descricao:'Lobo domesticado e treinado para acompanhar um personagem.'}],
 ['drone_auxiliar_zk4','Drone auxiliar ZK-4','🤖','Drone','Unidade robótica','Pequeno',2400,'Comum',{pvMax:8,movimento:8,capacidadeCargaKg:10,montaria:false,combatente:false,controlavel:true,robotico:true,energiaMax:20,habilidadesTexto:'Voo; iluminação; sensores básicos; transporte leve.',descricao:'Drone pessoal utilitário capaz de acompanhar seu proprietário e carregar equipamentos leves.'}],
 ['dragao_trombeta_domesticado','Dragão Trombeta domesticado','🐉','Criatura','Dragão Trombeta','Grande',3000,'Comum',{pvMax:28,movimento:8,capacidadeCargaKg:120,montaria:true,combatente:true,controlavel:true,robotico:false,energiaMax:0,habilidadesTexto:'Montaria; corrida; ataque natural.',descricao:'Um Dragão Trombeta domesticado e vinculado a um personagem.'}]
];
export const MONTARIAS=M.map(([id,nome,icone,categoria,especie,tamanho,preco,nivelAcesso,x])=>({id,nome,icone,categoria,especie,tamanho,preco,nivelAcesso,vendavel:true,disponivelCampanha:true,imagem:'',...x}));
// instância de companheiro na ficha (mesmo formato do vínculo feito pelo mestre no Banco)
export const instanciaMontaria=m=>({instanciaId:`comp_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,modeloId:m.id,nomeIndividual:m.nome,estado:'Saudável',pvAtual:m.pvMax,pvMax:m.pvMax,energiaAtual:m.energiaMax,energiaMax:m.energiaMax,observacoes:'Comprado na loja.',vinculadoEm:new Date().toISOString(),modelo:JSON.parse(JSON.stringify(m))});
export const catalogo=tipo=>tipo==='naves'?NAVES:tipo==='montarias'?MONTARIAS:VEICULOS;

export function instalarConcessionaria(dep){
 const root=dep.root||document,win=root.defaultView||window;
 const D=p=>dep.doc(dep.db,p);
 const ehMestre=()=>{try{return !!dep.ehMestre?.();}catch(_){return false;}};
 const uid=()=>{try{return String(dep.uid?.()||'');}catch(_){return '';}};
 const char=()=>{try{return dep.personagem?.()||null;}catch(_){return null;}};
 let estado={},assinado='',parar=[];const processados=new Set();
 // ------------------------------------------------------------ modelos no banco (mestre, uma vez)
 let cadastrado=false;
 async function cadastrar(){
  if(cadastrado||!ehMestre())return;cadastrado=true;
  // v193: veículos ficaram mais acessíveis; atualiza só o preço dos modelos já cadastrados no banco (uma vez)
  try{const g=await dep.getDoc(D('configuracoes/veiculosPrecosV193b'));if(!g.exists()){const jaTem=await dep.getDoc(D('configuracoes/veiculosV171'));if(jaTem.exists()){for(const v of VEICULOS)await dep.setDoc(D('veiculos/'+v.id),{preco:v.preco},{merge:true});for(const n of NAVES)await dep.setDoc(D('naves/'+n.id),{preco:n.preco},{merge:true});try{dep.recarregar?.();}catch(_){}}await dep.setDoc(D('configuracoes/veiculosPrecosV193b'),{em:new Date().toISOString()});}}catch(e){console.warn('[Concessionária] preços',e);}
  try{const f=await dep.getDoc(D('configuracoes/veiculosV171'));if(f.exists())return;
   const abs=s=>s?new URL(s,win.location.href).href:'';
   for(const v of VEICULOS)await dep.setDoc(D('veiculos/'+v.id),clean({...v,imagem:abs(v.imagem)}),{merge:true});
   for(const n of NAVES)await dep.setDoc(D('naves/'+n.id),clean({...n,imagem:abs(n.imagem)}),{merge:true});
   await dep.setDoc(D('configuracoes/veiculosV171'),{em:new Date().toISOString(),veiculos:VEICULOS.length,naves:NAVES.length});
   try{dep.recarregar?.();}catch(_){}
  }catch(e){console.warn('[Concessionária] cadastro',e);cadastrado=false;}
 }
 // ------------------------------------------------------------ tela
 const CSS=`#ccModal{position:fixed;inset:0;z-index:9500;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center}#ccModal[hidden]{display:none}
#ccModal .cc-c{width:min(1060px,96vw);max-height:90vh;overflow:auto;background:#0d1526;border:1px solid #ffd166;border-radius:14px;padding:14px;color:#e8eefc;font:13px 'Segoe UI',Arial,sans-serif}
#ccModal h2{margin:0 0 4px;color:#ffd166;display:flex;align-items:center;gap:8px}#ccModal h2 span{flex:1}#ccModal .cc-x{width:30px;height:30px;border-radius:8px;border:1px solid #3b5878;background:#16233a;color:#fff;cursor:pointer}
#ccModal .cc-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px;margin-top:10px}
#ccModal .cc-i{border:1px solid #2a3c58;border-radius:11px;padding:8px;background:rgba(255,255,255,.03);display:flex;flex-direction:column;gap:5px}
#ccModal .cc-i .cc-img{height:150px;display:flex;align-items:center;justify-content:center;background:radial-gradient(#2a3550,#141c2e);border-radius:8px}
#ccModal .cc-mini{width:140px;height:140px;object-fit:contain}
#ccModal .cc-i img{max-height:140px;max-width:95%;object-fit:contain}#ccModal .cc-i b{color:#fff}#ccModal small{color:#9fb3cc}
#ccModal .cc-p{font-size:15px;color:#ffe9a8;font-weight:700}#ccModal button.cc-b{min-height:30px;border-radius:8px;border:1px solid #ffd166;background:#3a2e14;color:#ffe9a8;cursor:pointer;font:600 12px inherit}
#ccModal button.cc-b:disabled{opacity:.45;cursor:not-allowed}#ccModal .cc-msg{color:#d9f6ff;margin:6px 0;min-height:18px}`;
 let modal=null,tipoAberto='',lojaNome='';
 function abrir(tipo,nome=''){
  if(!root.getElementById('ccCss')){const st=root.createElement('style');st.id='ccCss';st.textContent=CSS;root.head.append(st);}
  if(!modal){modal=root.createElement('div');modal.id='ccModal';modal.hidden=true;modal.innerHTML='<div class="cc-c"></div>';root.body.append(modal);
   modal.addEventListener('click',e=>{if(e.target===modal||e.target.closest('.cc-x')){modal.hidden=true;return;}const b=e.target.closest('[data-comprar]');if(b)void comprar(b.dataset.comprar);});}
  tipoAberto=tipo;lojaNome=nome;modal.hidden=false;desenhar();
 }
 function desenhar(msg=''){
  if(!modal||modal.hidden)return;const c=char(),rec=Number(c?.recursos||0),lista=catalogo(tipoAberto),meu=estado?.[uid()]||{};
  modal.querySelector('.cc-c').innerHTML=`<h2>${tipoAberto==='naves'?'🚀':tipoAberto==='montarias'?'🐉':'🚗'} <span>${esc(lojaNome||(tipoAberto==='naves'?'Estaleiro do espaço-porto':tipoAberto==='montarias'?'Estábulo e animais':'Concessionária'))}</span><button type="button" class="cc-x" title="Fechar">✕</button></h2>
   <small>${c?`${esc(c.nome)} · ${rec.toLocaleString('pt-BR')} recursos`:'Escolha um personagem na aba Ficha para comprar.'} · O mestre confere e entrega ${tipoAberto==='montarias'?'o animal (ele aparece na ficha, em Companheiros)':'o veículo (ele aparece na ficha, em Veículos/Naves)'}.</small>
   <div class="cc-msg">${esc(msg||meu.msg||'')}</div>
   <div class="cc-g">${lista.map(v=>`<div class="cc-i"><div class="cc-img">${v.imagem?`<img src="${esc(v.imagem)}" alt="">`:(miniaturaDeItem(v)?`<img class="cc-mini" src="${miniaturaDeItem(v)}" alt="">`:v.icone)}</div><b>${v.icone} ${esc(v.nome)}</b>
    <small>${esc([v.categoria||v.tipo,v.tamanho||v.porte,v.dimensoes].filter(Boolean).join(' · '))}</small>
    <small>${tipoAberto==='montarias'?`PV ${v.pvMax} · Movimento ${v.movimento} · Carga ${v.capacidadeCargaKg} kg${v.montaria?' · Montaria':''}`:tipoAberto==='naves'?`Casco ${v.cascoMax} · Escudo ${v.escudoMax} · Carga ${(v.capacidadeCargaKg/1000).toLocaleString('pt-BR')} t · Tripulação ${v.tripulacaoMin}–${v.tripulacaoMax} · Passageiros ${v.passageiros}`:`Estrutura ${v.estruturaMax} · Movimento ${v.movimento} · Carga ${v.capacidadeCargaKg} kg · Passageiros ${v.passageiros}`}${v.nivelAcesso!=='Comum'?` · 🔒 ${esc(v.nivelAcesso)}`:''}</small>
    <div class="cc-p">${Number(v.preco).toLocaleString('pt-BR')} recursos</div>
    <button type="button" class="cc-b" data-comprar="${esc(v.id)}" ${!c||rec<v.preco?'disabled':''} title="${!c?'Escolha um personagem':rec<v.preco?'Recursos insuficientes':'Comprar'}">💰 Comprar</button></div>`).join('')}</div>`;
 }
 async function comprar(mid){
  const c=char();if(!c)return;const cmd={donoUid:uid(),personagemId:String(c.id),tipo:tipoAberto,modeloId:mid,criadoEm:Date.now()};
  desenhar('⏳ Pedido enviado ao mestre…');
  try{if(ehMestre())await processar('local'+Date.now(),cmd);else await dep.setDoc(D(PEDIDOS+'/c'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)),cmd);}catch(e){desenhar('⚠️ '+(e?.message||e));}
 }
 // ------------------------------------------------------------ o mestre entrega
 async function avisar(u,msg){estado={...estado,[u]:{msg,em:Date.now()}};try{await dep.setDoc(D(ESTADO),clean({[u]:{msg,em:Date.now()}}),{merge:true});}catch(_){}desenhar();}
 async function processar(pid,cmd){
  if(processados.has(pid))return;processados.add(pid);const u=String(cmd.donoUid||'');
  try{
   const lista=catalogo(cmd.tipo),m=lista.find(x=>x.id===cmd.modeloId);if(!m)throw Error('Modelo não encontrado.');
   const ref=D('personagens/'+cmd.personagemId);let nome='';
   await dep.runTransaction(dep.db,async tx=>{const s=await tx.get(ref);if(!s.exists())throw Error('Personagem não encontrado.');const c=s.data();
    if(String(c.dono||'')!==u&&!String(pid).startsWith('local'))throw Error('Pedido de quem não é dono do personagem.');
    const rec=Number(c.recursos||0);if(rec<m.preco)throw Error(`Recursos insuficientes (${rec.toLocaleString('pt-BR')} de ${m.preco.toLocaleString('pt-BR')}).`);
    nome=String(c.nome||'');tx.set(ref,{...c,recursos:rec-m.preco,...(cmd.tipo==='montarias'?{companheiros:[...(Array.isArray(c.companheiros)?c.companheiros:[]),instanciaMontaria(m)]}:{})});});
   if(cmd.tipo==='montarias'){try{await dep.registrar?.(cmd.personagemId,`${m.nome} comprado por ${m.preco}`);}catch(_){}try{dep.recarregarPersonagem?.(cmd.personagemId);}catch(_){}await avisar(u,`✅ ${nome||'Personagem'} adotou: ${m.nome} (${m.preco.toLocaleString('pt-BR')} recursos). Está na ficha, em Companheiros.`);return;}
   const id=(cmd.tipo==='naves'?'ship_':'veh_')+Date.now()+'_'+Math.random().toString(36).slice(2,8),abs=s=>s?new URL(s,win.location.href).href:'';
   const modelo={...m,imagem:abs(m.imagem)},vinc=[{personagemId:String(cmd.personagemId),personagemNome:nome,usuarioUid:u,papel:cmd.tipo==='naves'?'Capitão':'Proprietário'}];
   const inst=cmd.tipo==='naves'
    ?{id,modeloId:m.id,nomeIndividual:m.nome,modelo,cascoAtual:m.cascoMax,escudoAtual:m.escudoMax,energiaAtual:m.energiaMax,combustivelAtual:m.combustivelMax,estado:'Operacional',vinculos:vinc,usuariosPermitidos:[u],cargaItens:Array(100).fill(null),atualizadoEm:new Date().toISOString(),compradaPor:String(cmd.personagemId),criadoEm:new Date().toISOString()}
    :{id,modeloId:m.id,nomeIndividual:m.nome,modelo,estruturaAtual:m.estruturaMax,energiaAtual:m.energiaMax,combustivelAtual:m.combustivelMax,estado:'Operacional',vinculos:vinc,usuariosPermitidos:[u],cargaItens:[],compradoPor:String(cmd.personagemId),criadoEm:new Date().toISOString()};
   await dep.setDoc(D((cmd.tipo==='naves'?'navesPossuidas/':'veiculosPossuidos/')+id),clean(inst));
   try{await dep.registrar?.(cmd.personagemId,`${m.nome} comprado por ${m.preco}`);}catch(_){}
   await avisar(u,`✅ ${nome||'Personagem'} comprou: ${m.nome} (${m.preco.toLocaleString('pt-BR')} recursos). Está na ficha, em ${cmd.tipo==='naves'?'Naves':'Veículos'}.`);
  }catch(e){await avisar(u,'⚠️ '+(e?.message||e));}
  finally{if(!String(pid).startsWith('local'))try{await dep.deleteDoc(D(PEDIDOS+'/'+pid));}catch(_){}}
 }
 function assinar(){
  parar.forEach(f=>{try{f();}catch(_){}});parar=[];
  parar.push(dep.onSnapshot(D(ESTADO),s=>{estado=s.exists()?s.data():{};desenhar();},()=>{}));
  if(ehMestre())parar.push(dep.onSnapshot(dep.collection(dep.db,...PEDIDOS.split('/')),q=>{q.forEach(d=>{void processar(d.id,d.data()||{});});},()=>{}));
 }
 const vigia=setInterval(()=>{try{const k=uid()+'|'+ehMestre();if(!uid())return;if(k!==assinado){assinado=k;assinar();}void cadastrar();}catch(e){console.warn('[Concessionária]',e);}},2500);
 win.mesaConcessionariaV171={abrir,processar,VEICULOS,NAVES};
 return {parar(){clearInterval(vigia);parar.forEach(f=>{try{f();}catch(_){}});modal?.remove();}};
}
