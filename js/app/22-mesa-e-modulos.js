// v205: o Firestore NÃO aceita array dentro de array ("Nested arrays are not supported"). A cena do mapa tem rectsV201/blocosV201 = [[x,y,w,h],…]; salvar a reforma falhava com invalid-argument. Na gravação cada array interno vira {__arrV205:[…]} e na leitura volta ao formato original (os módulos continuam vendo arrays de arrays).
function mesaCodificarAninhadosV205_(v){
 if(Array.isArray(v))return v.map(x=>Array.isArray(x)?{__arrV205:mesaCodificarAninhadosV205_(x)}:(x===undefined?null:mesaCodificarAninhadosV205_(x)));
 if(v&&typeof v==='object'&&v.constructor===Object){const o={};for(const k of Object.keys(v)){if(v[k]===undefined)continue;o[k]=mesaCodificarAninhadosV205_(v[k]);}return o;} // campo undefined: o Firestore recusa ("Unsupported field value: undefined"); some da gravação
 return v;
}
function mesaDecodificarAninhadosV205_(v){
 if(Array.isArray(v))return v.map(mesaDecodificarAninhadosV205_);
 if(v&&typeof v==='object'&&v.constructor===Object){const ks=Object.keys(v);if(ks.length===1&&ks[0]==='__arrV205'&&Array.isArray(v.__arrV205))return mesaDecodificarAninhadosV205_(v.__arrV205);const o={};for(const k of ks)o[k]=mesaDecodificarAninhadosV205_(v[k]);return o;}
 return v;
}
import {perfilRT as perfilAtitudeRT_,exigirAtaqueRT as exigirAtitudeRT_} from './mesa-atitudes-dados.js?v=183';
import('./mesa-atitudes.js?v=183').then(m=>{window.mesaAtitudesMod=m.instalarAtitudes({db,doc,setDoc,getDoc,onSnapshot,collection,runTransaction,controller:()=>novaSyncController_,ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid});}).catch(e=>console.warn('[Atitudes]',e));
// Aba paralela: controlador independente e adaptador Firestore.
import {moverInventario,identidadeItem} from './nova-inventario.js?v=46';
async function novaCompraBloqueada_(char){const snap=await getDoc(doc(db,'combatesAtivos','mapaMesaSyncDireta'));const map=snap.data();if(!map?.combat?.active)return false;const p=await getDoc(doc(db,'combatesAtivos','mapaMesaSyncDireta','posicoes',encodeURIComponent(char.id)));if(!p.exists())return false;notificar_('Compras não são permitidas durante combate.','aviso');return true;}
import {slug as novaSlug_,aplicarTreinos,montarTreinos,periciaDoAtaque,migrarTreinos,vinculosCriatura} from './nova-criaturas.js?v=46';
function novaBaseCriatura_(attrs,name,special){const c={atributos:attrs,bonus:{}},q=novaSlug_(name),bank=special?especializacoesDB:periciasDB,reg=(bank||[]).find(p=>[p.id,p.nome,p.nome_en].some(n=>novaSlug_(n)===q));return reg?.formula?Number(calcularFormulaPersonagem_(reg.formula,c))||0:baseNPCPericia_(c,name);}

import {classificarTeste as novaClassificar_,locaisValidos as novaLocaisValidos_,descreverTeste as novaDescreverTeste_} from './nova-regras.js?v=46';
import {aplicarDanoArma as novaAplicarDanoArma_} from './nova-dano-armas.js?v=60';
import {criarRelogio as novaCriarRelogio_} from './nova-duracoes.js?v=46';
import {mountDirectPositionLab} from './nova-direta.js?v=242';
import {tocarEfeito} from './nova-fx.js?v=46';
import {identificarKit,testeComSorte,prepararSorte,resolverConsciencia} from './nova-recuperacao.js?v=99';
import {emComa as emComaV134_} from './nova-coma.js?v=134';
import {resolverSocorros,resolverPsi,ocupado,teste as novaTesteSuporte_,sorteio as novaSorteioSuporte_} from './nova-suporte.js?v=46';
import {ataqueSuperaDefesa,defesasRestantes} from './nova-turnos.js?v=36';
// v104: biblioteca de imagens (módulo à parte; se o arquivo faltar ou falhar, nada muda no site).
import('./mesa-imagens.js?v=104').then(m=>{window.mesaBibliotecaImagens=m.instalarBibliotecaImagens({db,doc,setDoc,getDoc,getDocs,collection,storage,ref,uploadBytes,getDownloadURL,
 ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid,objetosMapa:()=>objetosMapaDB,
 aoConcluir:()=>{try{renderizarBancoObjetosMapa_();}catch(_){}}});}).catch(e=>console.warn('[Biblioteca de imagens] indisponível; site segue normal.',e));
// v108: conteúdo novo aplicado pelo site (sem CSV) e Diretor de cena. Módulos à parte.
import('./mesa-conteudo.js?v=130').then(m=>{window.mesaConteudo=m.instalarConteudo({db,doc,setDoc,getDoc,storage,ref,uploadBytes,getDownloadURL,
 ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid,criaturas:()=>criaturasDB,npcs:()=>npcsDB,personagens:()=>userCharacters||[],
 normalizar:(tipo,bruto)=>normalizarLinhaImportacao_(tipo,bruto),recarregar:()=>carregarBancosDeDados()});}).catch(e=>console.warn('[Conteúdo] indisponível; site segue normal.',e));
import('./mesa-diretor.js?v=135').then(m=>{window.mesaDiretor=m.instalarDiretor({db,doc,setDoc,getDoc,getDocs,collection,runTransaction,onSnapshot,storage,ref,uploadBytes,getDownloadURL,
 ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid,criaturas:()=>criaturasDB,npcs:()=>npcsDB,objetosMapa:()=>objetosMapaDB,cenarios:()=>cenariosDB,controller:()=>novaSyncController_,
 normalizar:(tipo,bruto)=>normalizarLinhaImportacao_(tipo,bruto)});}).catch(e=>console.warn('[Diretor] indisponível; site segue normal.',e));
// v110: chão pintado dos mapas e formas com material. Módulo à parte.
import('./mesa-mapa-arte.js?v=197').then(m=>{window.mesaArteMapa=m.instalarArteMapa({Gerador:window.RPGTextureGeneratorV110_,limparCache:()=>window.gm2LimparTexturasV110_?.()});}).catch(e=>console.warn('[Arte do mapa] indisponível; site segue normal.',e));
// v111: combate em tempo real (botão ⚡ do mestre). Ponte com as regras da mesa + módulo à parte.
window.mesaTempoRealDadosV111_={
 async dados(t){
  const c=await novaFicha_(t),snap={...t,charLab:structuredClone(c)};
  const acoes=Math.max(1,Number(obterPAMaxCombate_(c))||1),mov=deslocamentoFichaV112_(c,t.nome,t);
  const ataques=[];
  for(const per of (batalhaListaPericias_(c)||[])){
   if(!periciaCriaturaPodeAtacar_(c,per))continue;
   for(const w of novaEquipamentos_(c,per)){
    if(!w?.item)continue;
    let alcance=1.5,distancia=false;try{alcance=Number(labAlcanceAtaque_(snap,w.item))||1.5;distancia=!!labAtaqueEhDistancia_(w.item);}catch(_){}
    ataques.push({skillId:batalhaTokenPericia_(per),weaponId:w.valor,nome:getNome(w.item),valor:novaValorPericia_(c,snap,per,w.graus||0),alcance,distancia});
   }
  }
  // v113: dados para o jeito de lutar (inteligência, tipo e descrição da ficha)
  const id=decodeURIComponent(String(t.id||'')),tipo=id.startsWith('synccriatura:')?'criatura':id.startsWith('syncnpc:')?'npc':'pj';
  const base=String(id.split(':').slice(1).join(':')).split('~')[0],modelo=tipo==='criatura'?(criaturasDB||[]).find(x=>String(x.id)===base):tipo==='npc'?(npcsDB||[]).find(x=>String(x.id)===base):null;
  const int=Number(c.atributos?.INT||0)+Number(c.bonus?.INT||0);
  const texto=[t.nome,c.nome,c.tipo,c.especie,c.raca,c.carreira,c.conceito,modelo?.tamanho,modelo?.descricao,modelo?.tipo].filter(Boolean).join(' ');
  // v133: socorros, resistência (consciência) e psi para o tempo real
  let info=null;try{info=novaInfoSuporte_(c,{...t});}catch(_){}
  let resistencia=0;try{const rp=batalhaPericiaPorNomes_(c,['resistência','resistencia']);resistencia=rp?Number(novaValorPericiaTotal_(c,rp))||0:0;}catch(_){}
  const poderes=(info?.powers||[]).filter(p=>['atordoar_psi','medo','grito_psiquico','cura_psi','impulso'].includes(p.id)).map(p=>({id:p.id,nome:p.name,custo:p.cost,alcance:p.range,valor:p.value}));
  const corpo=ataques.filter(a=>!a.distancia).reduce((m,a)=>Math.max(m,Number(a.valor)||0),0),longe=ataques.filter(a=>a.distancia).reduce((m,a)=>Math.max(m,Number(a.valor)||0),0);
  return {acoes,mov,ataques,int,tipo,texto,comportamento:String(modelo?.comportamento||c.comportamento||''),
   primeirosSocorros:Number(info?.firstAid?.value)||0,kits:(info?.kits||[]).reduce((n,k)=>n+(Number(k.uses)||0),0),resistencia,
   psi:{max:Number(info?.psiMax)||0,gasto:Number(info?.psiSpent)||0,poderes},corpoACorpo:corpo,aDistancia:longe};
 },
 preparar:(a,b,cmd)=>novaPrepararAtaque_(a,b,cmd),
 suporte:(a,b,tokens)=>novaPrepararSuporte_(a,b,tokens)
};
import('./mesa-tempo-real.js?v=228').then(m=>{window.mesaTempoReal=m.instalarTempoReal({db,doc,setDoc,getDoc,onSnapshot,collection,runTransaction,
 ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid,personagemId:()=>currentCharId,api:()=>window.mesaTempoRealDadosV111_,criaturas:()=>criaturasDB||[]});}).catch(e=>console.warn('[Tempo real] indisponível; site segue normal.',e));
// v112: Barra do Mestre em cima do mapa (trocar mapa, colocar, mover, desenhar, salvar sozinho). Módulo à parte.
window.mesaControllerV174_=()=>novaSyncController_; // v174: acesso ao controle da mesa (ferramentas e testes)
import('./mesa-barra.js?v=134').then(m=>{window.mesaBarraMestre=m.instalarBarraMestre({ehMestre:()=>userData?.role==='mestre',controller:()=>novaSyncController_,uid:()=>currentUserUid,
 db,doc,setDoc,getDoc,getDocs,deleteDoc,collection,runTransaction,docObjeto:id=>objetoMapaDocId_(id),
 criaturas:()=>criaturasDB,npcs:()=>npcsDB,objetos:()=>objetosMapaDB,mapas:()=>mapasDB,
 personagens:()=>(userCharacters||[]).filter(c=>{try{return personagemAtivoCampanhaV102_(c);}catch(_){return true;}})});}).catch(e=>console.warn('[Barra do mestre] indisponível; site segue normal.',e));
// v122: ações por dentro do mapa (balão flutuante, atalhos A/T/P/C/F, legenda). Módulo à parte.
import('./mesa-acoes-mapa.js?v=149').then(m=>{window.mesaAcoesMapa=m.instalarAcoesMapa({controller:()=>novaSyncController_});}).catch(e=>console.warn('[Ações no mapa] indisponível; site segue normal.',e));
// v124: ambiente interativo (portas, gavetas, luzes, máquinas). Ponte com as regras de perícia + módulo à parte.
window.mesaObjetosV124_={
 valor:async(tok,nome)=>{
  const p=acharPericiaInteracaoV76_(nome);if(!p)return null;const id=decodeURIComponent(String(tok?.id||''));let c=null;
  if(!id.startsWith('sync')){c=(userCharacters||[]).find(x=>String(x.id)===id)||null;if(!c){try{const a=obterPersonagemAtual_();if(String(a?.id||'')===id)c=a;}catch(_){}}}
  if(!c){try{c=await novaFicha_(tok);}catch(_){c=null;}}
  let v=0;if(c){try{v=Number(obterValorRegistroPericia_(c,p.id,false))||0;}catch(_){v=0;}}
  return {id:String(p.id),nome:getNome(p),valor:v};
 },
 rolar:valor=>{const die=1+Math.floor(Math.random()*100);return {die,...classificarD100_(valor,die)};},
 // v135: ferramentas que o personagem carrega (equipado ou no bolso): machado, picareta, pé de cabra, extintor, lanterna, kit
 ferramentas:tokId=>{const id=decodeURIComponent(String(tokId||''));let nomes=[];
  if(id.startsWith('syncnpc:')){const n=npcBancoPorId_(id.slice(8).split('~')[0]);nomes=String(n?.inventarioTexto||'').split(/[|;,\n]/);}
  else if(!id.startsWith('sync')){const c=(userCharacters||[]).find(x=>String(x.id)===id);if(c){const inv=normalizarInventario_(c);nomes=[...(inv.equipado||[]),...(inv.bolso||[])].filter(Boolean).map(i=>String(getNome(i)||i.nome||''));}}
  const t=nomes.map(x=>normalizarTextoCombate_(String(x))).join(' | ');
  return {machado:/machad|\baxe\b/.test(t),picareta:/picaret|pickaxe/.test(t),pecabra:/pe de cabra|pe-de-cabra|crowbar|alavanca/.test(t),extintor:/extintor|extinguisher/.test(t),lanterna:/lanterna|flashlight/.test(t),kit:/kit.*(medic|socorro)|medkit/.test(t)};},
 // v134: chaves que a ficha tem (para o botão 🔑 nas portas trancadas)
 chaves:tokId=>{const id=decodeURIComponent(String(tokId||''));if(id.startsWith('sync'))return [];const c=(userCharacters||[]).find(x=>String(x.id)===id);if(!c)return [];const inv=normalizarInventario_(c),out=[];for(const comp of ['equipado','bolso','mochila'])for(const it of inv[comp]||[])if(it&&(it.abre||/^(chave|cart[aã]o)/i.test(String(getNome(it)||it.nome||''))))out.push({nome:String(getNome(it)||it.nome||''),abre:String(it.abre||'')});return out;},
 // v125: itens no mapa e nos armários
 itens:()=>(itensDB||[]).map(i=>({id:String(i.id),nome:getNome(i)||String(i.id),imagem:String(i.imagem||''),categoria:String(i.categoria||i.tipo||'')})),
 itemInfo:id=>{const i=(itensDB||[]).find(x=>String(x.id)===String(id));return i?{id:String(i.id),nome:getNome(i)||String(i.id),imagem:String(i.imagem||''),descricao:String(getDescricao(i)||''),peso:Number(i.peso||0),categoria:String(i.categoria||i.tipo||'')}:null;},
 instancia:e=>{
  if(e?.tipo==='nota'){const id='nota_'+String(e.uid||Date.now().toString(36));return {id,idBanco:id,nome:'📜 '+String(e.nome||'Bilhete'),categoria:'Documento',tipo:'Nota',descricao:String(e.texto||''),texto:String(e.texto||''),peso:0,imagem:String(e.imagem||''),instanciaId:'nota_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),origemAquisicao:'mapa',adquiridoEm:new Date().toISOString()};}
  if(e?.instancia)return {...e.instancia};
  const it=(itensDB||[]).find(x=>String(x.id)===String(e?.idBanco||''));
  if(!it)return {id:String(e?.idBanco||'item'),idBanco:String(e?.idBanco||'item'),nome:String(e?.nome||'Item'),imagem:String(e?.imagem||''),descricao:String(e?.descricao||''),peso:0,instanciaId:'item_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),origemAquisicao:'mapa'};
  return {...JSON.parse(JSON.stringify(it)),idBanco:String(it.id),instanciaId:'item_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),pvAtual:Number(it.pv||0),origemAquisicao:'mapa',adquiridoEm:new Date().toISOString(),...(itemUsaMunicao_(it)?{cargaMax:cargaMaxArma_(it),cargaAtual:0}:{})};
 },
 // coloca a instância no inventário da ficha (mochila, depois bolso); devolve o inventário novo
 guardar:(ficha,inst)=>{const c=JSON.parse(JSON.stringify(ficha||{}));const inv=normalizarInventario_(c);for(const comp of ['mochila','bolso']){const k=inv[comp].findIndex(x=>!x);if(k>=0){inv[comp][k]=inst;return {inventario:inv,comp};}}throw Error('Mochila e bolsos cheios.');},
 // tira do inventário a arma derrubada (pela chave); devolve {inventario,item}
 retirarArma:(ficha,key)=>{const c=JSON.parse(JSON.stringify(ficha||{}));const inv=normalizarInventario_(c);for(const comp of Object.keys(inv)){const k=(inv[comp]||[]).findIndex(x=>x&&chaveArmaV125_(x)===String(key));if(k>=0){const item=inv[comp][k];inv[comp][k]=null;return {inventario:inv,item};}}return {inventario:inv,item:null};}
};
import('./mesa-objetos.js?v=209').then(m=>{window.mesaObjetos=m.instalarObjetos({db,doc,setDoc,deleteDoc,onSnapshot,collection,runTransaction,
 controller:()=>novaSyncController_,ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid,api:()=>window.mesaObjetosV124_});}).catch(e=>console.warn('[Objetos] indisponível; site segue normal.',e));
// v126: mapas ligados (saídas, viagem, mapa geral, mapas intermediários). Módulo à parte.
import('./mesa-ligacoes.js?v=205').then(m=>{window.mesaLigacoes=m.instalarLigacoes({db,doc,setDoc,getDoc,deleteDoc,onSnapshot,collection,runTransaction,
 controller:()=>novaSyncController_,ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid,mapas:()=>mapasDB||[],cenarios:()=>cenariosDB||[]});}).catch(e=>console.warn('[Ligações] indisponível; site segue normal.',e));
// v127: companheiros seguem o dono e fogem do perigo. Módulo à parte.
import('./mesa-companheiros.js?v=144').then(m=>{window.mesaCompanheirosMod=m.instalarCompanheiros({db,doc,setDoc,onSnapshot,runTransaction,
 controller:()=>novaSyncController_,ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid,criaturas:()=>criaturasDB||[],npcs:()=>npcsDB||[],personagens:()=>userCharacters||[],mapas:()=>mapasDB||[]});}).catch(e=>console.warn('[Companheiros] indisponível; site segue normal.',e));
// v128: animações e sons de batalha (explosão, raio, queda, morte, vozes de criaturas) e clima. Módulo à parte.
import('./mesa-efeitos.js?v=242').then(m=>{window.mesaEfeitos=m.instalarEfeitos({db,doc,setDoc,getDoc,onSnapshot,runTransaction,raio:()=>window.mesaRaioV132_,
 controller:()=>novaSyncController_,ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid,criaturas:()=>criaturasDB||[]});}).catch(e=>console.warn('[Efeitos] indisponível; site segue normal.',e));
// v129: rechear os mapas dos cenários com armários/baús, itens e bilhetes (botão 🎁 no 🕸️ Mapa geral).
import('./mesa-recheio.js?v=155').then(m=>{window.mesaRecheioMod=m.instalarRecheio({db,doc,setDoc,getDoc,ehMestre:()=>userData?.role==='mestre',
 mapas:()=>mapasDB||[],cenarios:()=>cenariosDB||[],objetos:()=>objetosMapaDB||[],itens:()=>itensDB||[]});}).catch(e=>console.warn('[Recheio] indisponível; site segue normal.',e));
// v132: cabeças que se estendem (Cila e outras criaturas de vários pescoços). Módulo à parte.
import('./mesa-cabecas.js?v=132').then(m=>{window.mesaCabecas=m.instalarCabecas({db,doc,onSnapshot,controller:()=>novaSyncController_,criaturas:()=>criaturasDB||[]});}).catch(e=>console.warn('[Cabeças] indisponível; site segue normal.',e));
// v136: arrastar personagens caídos e objetos. Ponte (Força e peso) + módulo à parte.
window.mesaArrastarV136_={async info(t){
 const c=await novaFicha_(t).catch(()=>null),id=decodeURIComponent(String(t?.id||'')),base=id.split(':').slice(1).join(':').split('~')[0];
 const modelo=id.startsWith('synccriatura:')?(criaturasDB||[]).find(x=>String(x.id)===base):id.startsWith('syncnpc:')?(npcsDB||[]).find(x=>String(x.id)===base):(userCharacters||[]).find(x=>String(x.id)===id);
 const FOR=Number(c?.atributos?.FOR||modelo?.FOR||10)+Number(c?.bonus?.FOR||0),txt=String(modelo?.pesoCorporal||c?.pesoCorporal||modelo?.peso||'');
 const m=/(\d+(?:[.,]\d+)?)\s*(t\b|ton|tonelada|kg)?/i.exec(txt),d=Number(t?.diametroM)>0?Number(t.diametroM):1;
 const peso=m?Number(m[1].replace(',','.'))*(/^t/i.test(m[2]||'')?1000:1):Math.round(75*Math.pow(d,2.4));
 return {FOR,peso:Number.isFinite(peso)&&peso>0?peso:75};
}};
import('./mesa-arrastar.js?v=136').then(m=>{window.mesaArrastarMod=m.instalarArrastar({db,doc,setDoc,deleteDoc,onSnapshot,collection,runTransaction,
 controller:()=>novaSyncController_,ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid,api:()=>window.mesaArrastarV136_});}).catch(e=>console.warn('[Arrastar] indisponível; site segue normal.',e));
// v138: ponte do pedágio de Denzel (perícias, armas e recursos de quem quer entrar em Véspera). Usada pelo navegador do mestre.
window.mesaPedagioV138_={
 async pericia(t,nomes){try{const c=await novaFicha_(t);const rp=batalhaPericiaPorNomes_(c,nomes);return rp?Number(novaValorPericiaTotal_(c,rp))||0:0;}catch(e){console.warn('[Pedágio] perícia',e);return 0;}},
 async car(t){try{const c=await novaFicha_(t);return Number(c.atributos?.CAR||10)+Number(c.bonus?.CAR||0);}catch(_){return 10;}},
 ehArma:i=>!!i&&itemEhArmaOuEscudo_(i)&&!/escudo/.test(categoriaNormalizada_(i)),
 async armas(id){const s=await getDoc(doc(db,'personagens',String(id)));if(!s.exists())return [];const inv=s.data().inventario||{};return ['equipado','bolso','mochila'].flatMap(k=>(inv[k]||[]).filter(i=>window.mesaPedagioV138_.ehArma(i)).map(i=>String(i.nome||'arma')));},
 async recursos(id){const s=await getDoc(doc(db,'personagens',String(id)));return s.exists()?Number(s.data().recursos||0):0;},
 async cobrar(id,valor){valor=Math.max(0,Math.round(Number(valor)||0));if(!valor)return 0;let resto=0;
  await runTransaction(db,async tx=>{const r=doc(db,'personagens',String(id)),s=await tx.get(r);if(!s.exists())throw Error('Ficha não encontrada.');const atual=Number(s.data().recursos||0);if(atual<valor)throw Error(`Recursos insuficientes (tem ${atual}).`);resto=atual-valor;tx.set(r,{recursos:resto},{merge:true});});
  const c=(userCharacters||[]).find(x=>String(x.id)===String(id));if(c)c.recursos=resto;return resto;},
 async guardarArmas(id){let tiradas=[];
  await runTransaction(db,async tx=>{const r=doc(db,'personagens',String(id)),s=await tx.get(r);if(!s.exists())throw Error('Ficha não encontrada.');const inv=JSON.parse(JSON.stringify(s.data().inventario||{}));tiradas=[];
   for(const k of ['equipado','bolso','mochila'])inv[k]=(inv[k]||[]).map(i=>{if(window.mesaPedagioV138_.ehArma(i)){tiradas.push(i);return null;}return i;});tx.set(r,{inventario:inv},{merge:true});});
  const c=(userCharacters||[]).find(x=>String(x.id)===String(id));if(c){try{const s=await getDoc(doc(db,'personagens',String(id)));c.inventario=s.data().inventario;}catch(_){}}return tiradas;},
 async devolverArmas(id,itens=[]){if(!itens.length)return 0;let n=0;
  await runTransaction(db,async tx=>{const r=doc(db,'personagens',String(id)),s=await tx.get(r);if(!s.exists())throw Error('Ficha não encontrada.');const inv=JSON.parse(JSON.stringify(s.data().inventario||{}));n=0;
   for(const it of itens){let posto=false;for(const k of ['equipado','mochila','bolso']){const l=inv[k]=Array.isArray(inv[k])?inv[k]:[];const tam={equipado:12,mochila:20,bolso:2}[k];let i=l.findIndex(x=>!x);if(i<0&&l.length<tam)i=l.length;if(i>=0){l[i]=it;posto=true;n++;break;}}if(!posto)break;}
   tx.set(r,{inventario:inv},{merge:true});});
  const c=(userCharacters||[]).find(x=>String(x.id)===String(id));if(c){try{const s=await getDoc(doc(db,'personagens',String(id)));c.inventario=s.data().inventario;}catch(_){}}return n;}
};
// v138: personagem de teste do mestre (todas as perícias e especializações em 50%, psi incluído) para ver o jogo como jogador.
async function ajustarEquipamentoKaelV216_(c){
 const original='personagens/teste_jogador_v138',rota=globalThis.mesaTreinoRotaV205?.(original);if(rota&&rota!==original)return c;
 if(userData?.role!=='mestre'||!c?.testeV138||c.equipCompativelV216)return c;
 const ref=doc(db,'personagens','teste_jogador_v138');
 return runTransaction(db,async tx=>{const snap=await tx.get(ref);if(!snap.exists())return c;const atual=snap.data();if(!atual.testeV138||atual.equipCompativelV216)return {id:'teste_jogador_v138',...atual};
  const inv=structuredClone(normalizarInventario_(atual)),pericias=(batalhaListaPericias_(atual)||[]).filter(p=>periciaCriaturaPodeAtacar_(atual,p)&&p.__especializacao);
  const comp=it=>pericias.some(p=>penalidadeCompatibilidadeArma_(p,it)===0);
  const guardar=it=>{for(const [key,max] of [['mochila',20],['bolso',2],['veiculo',50],['casa',100]]){const l=inv[key]||[];let i=l.findIndex(x=>!x);if(i<0&&l.length<max)i=l.length;if(i>=0){l[i]=it;inv[key]=l;return true;}}return false;};
  for(let i=0;i<inv.equipado.length;i++){const it=inv.equipado[i];if(it&&itemEhArmaOuEscudo_(it)&&!itemEhEscudo_(it)&&!comp(it)){if(!guardar(it))throw Error('Sem espaço para guardar a arma incompatível do Kael.');inv.equipado[i]=null;}}
  const bancos=(itensDB||[]).filter(it=>itemEhArmaOuEscudo_(it)&&!itemEhEscudo_(it)&&comp(it));
  for(const re of [/faca|adaga|espada/i,/pistola/i,/rifle|fuzil|carabina/i]){if(inv.equipado.some(it=>it&&re.test(getNome(it))))continue;const it=bancos.find(it=>re.test(getNome(it)));const slot=inv.equipado.findIndex(x=>!x);if(it&&slot>=0)inv.equipado[slot]={...it,idBanco:it.id,instanciaId:'kael_v216_'+it.id,pvAtual:Number(it.pv||0),...(itemUsaMunicao_(it)?{cargaMax:cargaMaxArma_(it),cargaAtual:cargaMaxArma_(it)}:{})};}
  tx.set(ref,{inventario:inv,equipCompativelV216:true},{merge:true});return {id:'teste_jogador_v138',...atual,inventario:inv,equipCompativelV216:true};
 });
}
window.criarPersonagemTesteV138_=async function(){
 if(userData?.role!=='mestre'&&!window.mesaModoJogadorV138_)return null;
 const ID='teste_jogador_v138',ref=doc(db,'personagens',ID);
 const existente=await getDoc(ref);if(existente.exists())return await ajustarEquipamentoKaelV216_({id:ID,...existente.data()});
 const atr={FOR:10,CON:10,TAM:10,DES:10,INT:10,POD:10,CAR:10};
 const c={nome:'Kael Teste',raca:'Humano',conceito:'Personagem de teste do mestre',sexo:'—',idade:30,origem:'Véspera',carreira:'Aventureiro',classeSocial:'Pessoa Livre',tipoCorporal:'Médio',imagem:null,
  recursos:500,pontosSorte:null,pontosMagiaGastos:0,atributos:atr,bonus:{FOR:0,CON:0,TAM:0,DES:0,INT:0,POD:0,CAR:0},pericias:{},especializacoes:{},
  inventario:{equipado:Array(12).fill(null),bolso:Array(2).fill(null),mochila:Array(20).fill(null),veiculo:Array(50).fill(null),casa:Array(100).fill(null)},
  combate:{hitLocations:{},armor:{},fadiga:'Fresh',armas:[],municao:[]},dono:currentUserUid,tipo:'pc',etapaCriacao:5,fichaAprovada:true,fichaStatus:'aprovada',criacaoConcluida:true,
  criacaoConcluidaEm:new Date().toISOString(),criadoEm:new Date().toISOString(),anotacoes:'Personagem de teste: todas as perícias em 50%. Use “Ver como jogador” para explorar como os jogadores.',eventos:'',ativoNaCampanha:true,testeV138:true};
 const treinar=(lista,alvo)=>{for(const p of (lista||[])){if(!p?.id)continue;let base=0;try{base=calcularFormulaPersonagem_(p.formula,c);}catch(_){}alvo[p.id]={investimentos:{origem:0,carreira:0,hobbie:0,xp:Math.max(1,50-Math.round(Number(base)||0))}};}};
 treinar(periciasDB,c.pericias);treinar(especializacoesDB,c.especializacoes);
 // armas e ferramentas do banco (corpo a corpo, pistola, rifle + itens com efeito)
 const novo=(it,k)=>({...it,idBanco:it.id,instanciaId:`item_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,pvAtual:Number(it.pv||0),origemAquisicao:'teste_v138',adquiridoEm:new Date().toISOString(),...(itemUsaMunicao_(it)?{cargaMax:cargaMaxArma_(it),cargaAtual:cargaMaxArma_(it)}:{})});
 const armas=(itensDB||[]).filter(i=>itemEhArmaOuEscudo_(i)&&!/escudo/.test(categoriaNormalizada_(i))&&(batalhaListaPericias_(c)||[]).some(p=>p.__especializacao&&penalidadeCompatibilidadeArma_(p,i)===0));
 const pega=re=>armas.find(i=>re.test(String(i.nome||'')));
 const escolhidas=[armas.find(i=>itemEhCorpoACorpo_(i)&&/faca|adaga|espada|lâmina|lamina|bast|machad/i.test(i.nome||''))||armas.find(i=>itemEhCorpoACorpo_(i)),pega(/pistola/i),pega(/rifle|fuzil|carabina/i)].filter(Boolean);
 escolhidas.forEach((it,k)=>{c.inventario.equipado[k]=novo(it);});
 const ferramentas=['lanterna','kit m[eé]dico|primeiros socorros','extintor','picareta','machado'].map(r=>(itensDB||[]).find(i=>new RegExp(r,'i').test(String(i.nome||''))&&!escolhidas.includes(i))).filter(Boolean);
 ferramentas.forEach((it,k)=>{c.inventario.mochila[k]=novo(it);});
 await setDoc(ref,JSON.parse(JSON.stringify(c)));
 const pronto={id:ID,...c};if(!(userCharacters||[]).some(x=>x.id===ID))userCharacters.push(pronto);
 return pronto;
};
// v141: comerciantes genéricos de várias raças, com o nome descoberto na conversa. Módulo à parte.
import('./mesa-comerciantes.js?v=141').then(m=>{window.mesaComerciantesMod=m.instalarComerciantes({db,doc,setDoc,getDoc,deleteDoc,onSnapshot,collection,runTransaction,storage,ref,uploadBytes,getDownloadURL,
 controller:()=>novaSyncController_,ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid,npcs:()=>npcsDB||[],mapas:()=>mapasDB||[],normalizar:(tipo,bruto)=>normalizarLinhaImportacao_(tipo,bruto)});}).catch(e=>console.warn('[Comerciantes] indisponível; site segue normal.',e));
// v140: posturas (agachado, rastejando, caído) e berro sonoro da Trombeta (empurrão, queda e surdez). Módulo à parte.
import('./mesa-posturas.js?v=146').then(m=>{window.mesaPosturasMod=m.instalarPosturas({db,doc,setDoc,deleteDoc,onSnapshot,collection,runTransaction,
 controller:()=>novaSyncController_,ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid});}).catch(e=>console.warn('[Posturas] indisponível; site segue normal.',e));
// v139: mapas refeitos pela descrição dos cenários, telhados que abrem e escadas entre andares. Módulos à parte.
import('./mesa-remodelagem.js?v=155').then(m=>{window.mesaRemodelagemMod=m.instalarRemodelagem({db,doc,setDoc,getDoc,deleteDoc,runTransaction,getDocs,collection,
 controller:()=>novaSyncController_,ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid,mapas:()=>mapasDB||[],objetos:()=>objetosMapaDB||[],cenarios:()=>cenariosDB||[],npcs:()=>npcsDB||[],itens:()=>itensDB||[],personagens:()=>userCharacters||[],criaturas:()=>criaturasDB||[]});}).catch(e=>console.warn('[Remodelagem] indisponível; site segue normal.',e));
import('./mesa-tetos.js?v=154').then(m=>{window.mesaTetosMod=m.instalarTetos({db,doc,setDoc,deleteDoc,onSnapshot,collection,runTransaction,
 controller:()=>novaSyncController_,ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid});}).catch(e=>console.warn('[Tetos] indisponível; site segue normal.',e));
// v143: objetos que o mestre arruma ficam onde ele deixou (mesmo se o mapa for refeito) + arrumação de móveis sobrepostos.
import('./mesa-fixos.js?v=146').then(m=>{window.mesaFixosMod=m.instalarFixos({db,doc,setDoc,getDoc,onSnapshot,runTransaction,ehMestre:()=>userData?.role==='mestre',mapas:()=>mapasDB||[]});}).catch(e=>console.warn('[Fixos] indisponível; site segue normal.',e));
// v138: Véspera refeita (espaço-porto, portão no pico, ruas em labirinto), pedágio de Denzel e personagem de teste. Módulos à parte.
import('./mesa-vespera.js?v=206').then(m=>{window.mesaVesperaMod=m.instalarVespera({db,doc,setDoc,getDoc,runTransaction,storage,ref,uploadBytes,getDownloadURL,personagens:()=>userCharacters||[],
 controller:()=>novaSyncController_,ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid,mapas:()=>mapasDB||[],objetos:()=>objetosMapaDB||[],cenarios:()=>cenariosDB||[],npcs:()=>npcsDB||[]});}).catch(e=>console.warn('[Véspera] indisponível; site segue normal.',e));
// v184: masmorra de treino (labirinto com monstros, armadilhas, paredes e pedras que quebram e se reconstroem) + Kael Teste completo. Módulo à parte.
import('./mesa-masmorra.js?v=198').then(m=>{window.mesaMasmorraMod=m.instalarMasmorra({db,doc,setDoc,getDoc,deleteDoc,onSnapshot,collection,runTransaction,controller:()=>novaSyncController_,ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid,
 mapas:()=>mapasDB||[],objetos:()=>objetosMapaDB||[],criaturas:()=>criaturasDB||[],itens:()=>itensDB||[],personagens:()=>userCharacters||[],pericia:(t,nomes)=>window.mesaPedagioV138_.pericia(t,nomes),atingir:(t,h,mapa,o)=>window.mesaRaioV132_.atingir(t,h,mapa,o),
 novoItem:it=>({...it,idBanco:it.id,instanciaId:`item_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,pvAtual:Number(it.pv||0),origemAquisicao:'teste_v184',adquiridoEm:new Date().toISOString(),...(itemUsaMunicao_(it)?{cargaMax:cargaMaxArma_(it),cargaAtual:cargaMaxArma_(it)}:{})})});}).catch(e=>console.warn('[Masmorra] indisponível; site segue normal.',e));
// v192: equipamento e mochila dentro do mapa (equipar, guardar, usar), com mouse, teclado e controle. Módulo à parte.
import('./mesa-equipar.js?v=192').then(m=>{window.mesaEquiparMod=m.instalarEquipar({db,doc,setDoc,getDoc,controller:()=>novaSyncController_,nomeItem:i=>getNome(i),descricaoItem:i=>getDescricao(i)||i?.descricao||'',pesoItem:i=>pesoItem_(i),pesoEfetivo:(c,inv,comp)=>pesoEfetivoCompartimento_(c,inv,comp),limitePeso:(c,comp)=>limitePesoCompartimento_(c,comp),
 imagemItem:i=>{const b=(itensDB||[]).find(x=>String(x.id)===String(i?.idBanco||i?.id));return b?.imagem||'';},aposMudar:(id,inv)=>{try{const c=(userCharacters||[]).find(x=>String(x.id)===String(id));if(c){c.inventario=inv;renderizarInventario(c);}}catch(_){}}});}).catch(e=>console.warn('[Equipar] indisponível; site segue normal.',e));
// v192: controles como num videogame (teclado, mouse e controle remapeáveis, com balão de ajuda). Módulo à parte.
// v197: 🎨 editor rápido (construir pintando, como no RPG Map do Deepnight)
import('./mesa-editor-rapido.js?v=197').then(m=>{window.mesaEditorRapidoMod=m.instalarEditorRapido({controller:()=>novaSyncController_,ehMestre:()=>userData?.role==='mestre',objetos:()=>objetosMapaDB||[]});}).catch(e=>console.warn('[Editor rápido] indisponível; site segue normal.',e));
// v195: 🏘️ começar o bairro (Cidade Baixa vazia, só Portão e Escadaria ligados) — só roda quando o mestre manda
import('./mesa-bairro.js?v=195').then(m=>{window.mesaBairroMod=m.instalarBairro({db,doc,setDoc,getDoc,runTransaction,ehMestre:()=>userData?.role==='mestre',mapas:()=>mapasDB||[],controller:()=>novaSyncController_});}).catch(e=>console.warn('[Bairro] indisponível; site segue normal.',e));
import('./mesa-controles.js?v=192').then(m=>{window.mesaControlesModulo=m.instalarControles({controller:()=>novaSyncController_});}).catch(e=>console.warn('[Controles] indisponível; site segue normal.',e));
// v190: estrutura dos mapas (liga a masmorra e mapas soltos, conserta ligações), usar itens (curar, antídoto, fadiga, proteção, luz) e montaria/veículos com animações. Módulos à parte.
import('./mesa-estrutura.js?v=190').then(m=>{window.mesaEstruturaMod=m.instalarEstrutura({db,doc,setDoc,getDoc,ehMestre:()=>userData?.role==='mestre',mapas:()=>mapasDB||[]});}).catch(e=>console.warn('[Estrutura] indisponível; site segue normal.',e));
import('./mesa-uso-itens.js?v=190').then(m=>{window.mesaUsoItensMod=m.instalarUsoItens({db,doc,setDoc,getDoc,deleteDoc,onSnapshot,collection,runTransaction,controller:()=>novaSyncController_,ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid});}).catch(e=>console.warn('[Itens] indisponível; site segue normal.',e));
import('./mesa-transporte.js?v=190').then(m=>{window.mesaTransporteMod=m.instalarTransporte({db,doc,setDoc,getDoc,deleteDoc,onSnapshot,collection,runTransaction,controller:()=>novaSyncController_,ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid,criaturas:()=>criaturasDB||[]});}).catch(e=>console.warn('[Transporte] indisponível; site segue normal.',e));
import('./mesa-pedagio.js?v=149').then(m=>{window.mesaPedagioMod=m.instalarPedagio({db,doc,setDoc,getDoc,deleteDoc,onSnapshot,collection,runTransaction,
 controller:()=>novaSyncController_,ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid,mapas:()=>mapasDB||[]});}).catch(e=>console.warn('[Pedágio] indisponível; site segue normal.',e));
// v137: vida nos mapas fora do combate (limpeza, feira, guardas montados, caça) e mapas amplos. Módulo à parte.
// v144: andares por cima do térreo, zoom/câmera que acompanha o personagem e trabalhadores (mineradores/lenhadores). Módulos à parte.
import('./mesa-andares.js?v=182').then(m=>{window.mesaAndaresMod=m.instalarAndares({db,doc,setDoc,getDoc,deleteDoc,onSnapshot,collection,runTransaction,ficha:novaDadosAcoes_,periciaSalto:async t=>{const c=await novaFicha_(t),p=batalhaPericiaPorNomes_(c,['atletismo']);return p?Number(novaValorPericiaTotal_(c,p))||0:0;},danoQueda:(t,h,mapa,dados)=>window.mesaRaioV132_.atingir(t,h,mapa,{dano:dados+'d6',nome:'Queda',ignorarArmadura:true}),
 controller:()=>novaSyncController_,ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid,mapas:()=>mapasDB||[]});}).catch(e=>console.warn('[Andares] indisponível; site segue normal.',e));
// v163: o que cada comerciante vende (lojas por ramo, o mestre escolhe) e marcador de áreas para mapas feitos de imagem. Módulos à parte.
import('./mesa-lojas.js?v=163').then(m=>{window.mesaLojasMod=m.instalarLojas({db,doc,setDoc,controller:()=>novaSyncController_,ehMestre:()=>userData?.role==='mestre',itens:()=>itensDB||[]});}).catch(e=>console.warn('[Lojas] indisponível; site segue normal.',e));
import('./mesa-marcador.js?v=163').then(m=>{window.mesaMarcadorMod=m.instalarMarcador({db,doc,setDoc,getDoc,storage,ref,uploadBytes,getDownloadURL,
 controller:()=>novaSyncController_,ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid,mapas:()=>mapasDB||[],objetos:()=>objetosMapaDB||[]});}).catch(e=>console.warn('[Marcador] indisponível; site segue normal.',e));
// v170: peças das imagens (arte/pecas) no Banco de Objetos; plantas pequenas não barram. Módulo à parte.
import('./mesa-pecas.js?v=170').then(m=>{window.mesaPecasMod=m.instalarPecas({db,doc,setDoc,getDoc,ehMestre:()=>userData?.role==='mestre',objetosMapa:()=>objetosMapaDB||[],aoConcluir:()=>{try{renderizarBancoObjetosMapa_();}catch(_){}}});}).catch(e=>console.warn('[Peças] indisponível; site segue normal.',e));
// v171: concessionária e estaleiro (veículos e naves à venda; o mestre entrega na ficha). Módulo à parte.
import('./mesa-concessionaria.js?v=171').then(m=>{window.mesaConcessionariaMod=m.instalarConcessionaria({db,doc,setDoc,getDoc,deleteDoc,onSnapshot,collection,runTransaction,
 ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid,personagem:()=>{try{return obterPersonagemAtual_();}catch(_){return null;}},
 recarregar:()=>{try{carregarVeiculosV83_?.();carregarNavesV86_?.();}catch(_){}},registrar:async(pid,txt)=>{try{const c=(userCharacters||[]).find(x=>String(x.id)===String(pid));if(c)await registrarEventoMestreNoPersonagem_(c,'Comércio',txt,{subtipo:'veiculo_compra'});}catch(_){}}});}).catch(e=>console.warn('[Concessionária] indisponível; site segue normal.',e));
import('./mesa-barras.js?v=159').then(m=>{window.mesaBarrasMod=m.instalarBarras({});}).catch(e=>console.warn('[Barras] indisponível; site segue normal.',e));
// v173: nomes só ao passar o mouse, grade de 1 m, cliques através das coberturas; caixas leves empurradas/puladas; apagar mapas
import('./mesa-vista.js?v=173').then(m=>{window.mesaVistaMod=m.instalarVista({controller:()=>novaSyncController_});}).catch(e=>console.warn('[Vista] indisponível; site segue normal.',e));
import('./mesa-empurrar.js?v=173').then(m=>{window.mesaEmpurrarMod=m.instalarEmpurrar({db,doc,setDoc,getDoc,deleteDoc,onSnapshot,collection,runTransaction,
 controller:()=>novaSyncController_,ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid,mapas:()=>mapasDB||[]});}).catch(e=>console.warn('[Empurrar] indisponível; site segue normal.',e));
import('./mesa-apagar-mapas.js?v=205').then(m=>{window.mesaApagarMapasMod=m.instalarApagarMapas({db,doc,setDoc,getDoc,deleteDoc,runTransaction,
 controller:()=>novaSyncController_,ehMestre:()=>userData?.role==='mestre',mapas:()=>mapasDB||[],cenarios:()=>cenariosDB||[],
 apagarMapa:async id=>{const m=(mapasDB||[]).find(x=>String(x.id)===String(id));try{await labMapaApagarPartesAntigas_(id,Number(m?.partes||0));}catch(_){}await deleteDoc(doc(db,'mapas',String(id)));
  mapasDB=(mapasDB||[]).filter(x=>String(x.id)!==String(id));try{if(String(labMapaSelecionado_||'')===String(id))labMapaSelecionado_='';}catch(_){}try{renderizarBancoMapas_();}catch(_){}try{labAtualizarSelectMapas_();}catch(_){}}});}).catch(e=>console.warn('[Apagar mapas] indisponível; site segue normal.',e));
// v179: viagem de nave entre lugares distantes (cena em tela cheia, eventos por posto, chegada no destino real)
// v181: 📜 roteiros (missões, diálogos, gatilhos) e 🤖 mesa automática. Módulo à parte.
import('./mesa-roteiros.js?v=181').then(m=>{window.mesaRoteirosMod=m.instalarRoteiros({db,doc,setDoc,getDoc,getDocs,deleteDoc,onSnapshot,collection,runTransaction,storage,ref,uploadBytes,getDownloadURL,
 controller:()=>novaSyncController_,ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid,mapas:()=>mapasDB||[],npcs:()=>npcsDB||[],criaturas:()=>criaturasDB||[],pericias:()=>periciasDB||[],
 normalizar:(tipo,bruto)=>normalizarLinhaImportacao_(tipo,bruto)});}).catch(e=>console.warn('[Roteiros] indisponível; site segue normal.',e));
import('./mesa-viagem.js?v=179').then(m=>{window.mesaViagemMod=m.instalarViagem({db,doc,setDoc,getDoc,getDocs,deleteDoc,onSnapshot,collection,runTransaction,
 controller:()=>novaSyncController_,ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid,mapas:()=>mapasDB||[]});}).catch(e=>console.warn('[Viagem] indisponível; site segue normal.',e));
// v178: imagens de objetos embutidas no banco (pesadas) viram arquivos — a mesa do mestre abre mais rápido
import('./mesa-leveza.js?v=178').then(m=>{window.mesaLevezaMod=m.instalarLeveza({db,doc,setDoc,ehMestre:()=>userData?.role==='mestre',objetos:()=>objetosMapaDB||[],enviarImagem:f=>uploadImagemBanco_(f,'objetos')});}).catch(e=>console.warn('[Leveza] indisponível; site segue normal.',e));
// v175: Oficina 3.0 — construir o mapa ao vivo (só o mestre vê as ferramentas; as pinceladas aparecem para todos)
import('./mesa-oficina3.js?v=180').then(m=>{window.mesaOficina3Mod=m.instalarOficina3({db,doc,setDoc,getDoc,onSnapshot,runTransaction,
 controller:()=>novaSyncController_,ehMestre:()=>userData?.role==='mestre',mapas:()=>mapasDB||[],objetos:()=>objetosMapaDB||[],enviarImagem:f=>uploadImagemBanco_(f,'pinceis')});}).catch(e=>console.warn('[Oficina 3] indisponível; site segue normal.',e));
import('./mesa-camera.js?v=209').then(m=>{window.mesaCameraMod=m.instalarCamera({controller:()=>novaSyncController_,ehMestre:()=>userData?.role==='mestre',db,doc,setDoc,onSnapshot});}).catch(e=>console.warn('[Câmera] indisponível; site segue normal.',e));
// v222: três abas do mestre em cima do MESMO mapa (construtor, mestre e jogo).
import('./mesa-tres-mapas.js?v=241').then(m=>{window.mesaTresMapas=m.instalarTresMapas({root:document,ehMestre:()=>userData?.role==='mestre',db,doc,getDoc,setDoc,deleteDoc,runTransaction,mapas:()=>mapasDB||[],uid:()=>currentUserUid});}).catch(e=>console.warn('[Três mapas] indisponível; site segue normal.',e));
import('./mesa-trabalho.js?v=154').then(m=>{window.mesaTrabalhoMod=m.instalarTrabalho({db,doc,setDoc,getDoc,runTransaction,storage,ref,uploadBytes,getDownloadURL,
 controller:()=>novaSyncController_,ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid,npcs:()=>npcsDB||[],mapas:()=>mapasDB||[],normalizar:(tipo,bruto)=>normalizarLinhaImportacao_(tipo,bruto)});}).catch(e=>console.warn('[Trabalho] indisponível; site segue normal.',e));
// v145: névoa de guerra por mapa e a subida para a Cidade Superior (escadaria, praça, Cálice, Câmara, Residência de Ilü-Mus-Ki). Módulos à parte.
import('./mesa-nevoa.js?v=204').then(m=>{window.mesaNevoaMod=m.instalarNevoa({db,doc,setDoc,onSnapshot,controller:()=>novaSyncController_,ehMestre:()=>userData?.role==='mestre',mapas:()=>mapasDB||[],personagemId:()=>currentCharId,
 fichaDe:(id)=>{const raw=String(id||'');let dec=raw;try{dec=decodeURIComponent(raw);}catch(_){}return (userCharacters||[]).find(p=>String(p.id)===raw||String(p.id)===dec)||null;}});}).catch(e=>console.warn('[Névoa] indisponível; site segue normal.',e));
import('./mesa-cidade-alta.js?v=155').then(m=>{window.mesaCidadeAltaMod=m.instalarCidadeAlta({db,doc,setDoc,getDoc,deleteDoc,onSnapshot,collection,runTransaction,storage,ref,uploadBytes,getDownloadURL,
 controller:()=>novaSyncController_,ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid,mapas:()=>mapasDB||[],objetos:()=>objetosMapaDB||[],cenarios:()=>cenariosDB||[],npcs:()=>npcsDB||[],itens:()=>(typeof itensDB!=='undefined'?itensDB:[]),normalizar:(tipo,bruto)=>normalizarLinhaImportacao_(tipo,bruto)});}).catch(e=>console.warn('[Cidade Alta] indisponível; site segue normal.',e));
import('./mesa-vaelkor.js?v=145').then(m=>{window.mesaVaelkorMod=m.instalarVaelkor({db,doc,setDoc,onSnapshot,runTransaction,controller:()=>novaSyncController_,ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid,personagemId:()=>currentCharId});}).catch(e=>console.warn('[Casa Vaelkor] indisponível; site segue normal.',e));
// v146: faxina dos mapas (móveis que vazaram de outro mapa, cópias repetidas de NPCs com nome). Módulo à parte.
import('./mesa-limpeza.js?v=153').then(m=>{window.mesaLimpezaMod=m.instalarLimpeza({db,doc,setDoc,getDoc,deleteDoc,onSnapshot,controller:()=>novaSyncController_,ehMestre:()=>userData?.role==='mestre',mapas:()=>mapasDB||[],npcs:()=>npcsDB||[]});}).catch(e=>console.warn('[Faxina] indisponível; site segue normal.',e));
// v147: conversas com NPCs de nome (retrato, escolhas e testes para o grupo, testes ocultos só para o mestre). Módulo à parte.
import('./mesa-conversas.js?v=156').then(m=>{window.mesaConversasMod=m.instalarConversas({db,doc,setDoc,getDoc,deleteDoc,onSnapshot,collection,runTransaction,controller:()=>novaSyncController_,ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid,npcs:()=>npcsDB||[]});}).catch(e=>console.warn('[Conversas] indisponível; site segue normal.',e));
// v143: dia e noite (sono, tocas, guardas revezando, robôs recarregando, noturnos) e barulho que acorda. Módulo à parte.
import('./mesa-noite.js?v=144').then(m=>{window.mesaNoiteMod=m.instalarNoite({db,doc,setDoc,getDoc,deleteDoc,onSnapshot,collection,runTransaction,
 controller:()=>novaSyncController_,ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid,mapas:()=>mapasDB||[],criaturas:()=>criaturasDB||[],npcs:()=>npcsDB||[]});}).catch(e=>console.warn('[Noite] indisponível; site segue normal.',e));
// v200: atitudes (sanguinária, agressiva, defensiva, aliada) e vida simples (um PV só, fadiga e psiquismo) no combate em tempo real. Módulos à parte.
import('./mesa-atitudes-ia.js?v=200').then(m=>{window.mesaAtitudesIaMod=m.instalarAtitudes({db,doc,setDoc,getDoc,onSnapshot,runTransaction,criaturas:()=>criaturasDB,controller:()=>novaSyncController_,ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid});}).catch(e=>console.warn('[Atitudes] indisponível; site segue normal.',e));
import('./mesa-vida-simples.js?v=200').then(m=>{window.mesaVidaSimplesMod=m.instalarVidaSimples({db,doc,setDoc,getDoc,onSnapshot,controller:()=>novaSyncController_,ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid});}).catch(e=>console.warn('[Vida simples] indisponível; site segue normal.',e));
import('./mesa-copas.js?v=203').then(m=>{window.mesaCopasMod=m.instalarCopas({db,doc,runTransaction,controller:()=>novaSyncController_,ehMestre:()=>userData?.role==='mestre'});}).catch(e=>console.warn('[Copas] indisponível.',e));
import('./mesa-personagem-editor.js?v=205').then(m=>{window.mesaPersonagemEditorMod=m.instalarEditorPersonagem({db,doc,setDoc,getDoc,controller:()=>novaSyncController_});}).catch(e=>console.warn('[Personagem] editor indisponível.',e));
import('./mesa-cursor-modos.js?v=205').then(m=>{window.mesaCursorModosMod=m.instalarCursorModos({controller:()=>novaSyncController_});}).catch(e=>console.warn('[Cursor] indisponível.',e));
import('./mesa-barra-organizada.js?v=205').then(m=>{window.mesaBarraOrganizadaMod=m.instalarBarraOrganizada({root:document,controller:()=>novaSyncController_});}).catch(e=>console.warn('[Barra] indisponível.',e));
import('./mesa-sombras-luz.js?v=205').then(m=>{window.mesaSombrasLuzMod=m.instalarSombrasLuz({root:document,controller:()=>novaSyncController_,mapas:()=>mapasDB||[]});}).catch(e=>console.warn('[Sombras] indisponível.',e));
import('./mesa-correr.js?v=205').then(m=>{window.mesaCorrerMod=m.instalarCorrer({root:document,controller:()=>novaSyncController_});}).catch(e=>console.warn('[Correr] indisponível.',e));
import('./mesa-atuar-aba.js?v=205').then(m=>{window.mesaAtuarAbaMod=m.instalarAtuarAba({root:document,ehMestre:()=>userData?.role==='mestre'});}).catch(e=>console.warn('[Atuar como → aba] indisponível.',e));
import('./mesa-hub-teste.js?v=205').then(m=>{window.mesaHubTesteMod=m.instalarHubTeste({root:document,db,doc,setDoc,getDoc,deleteDoc,controller:()=>novaSyncController_,mapas:()=>mapasDB||[],criaturas:()=>criaturasDB||[],npcs:()=>npcsDB||[],uid:()=>currentUserUid});}).catch(e=>console.warn('[Mapa de teste] painel indisponível.',e));
import('./mesa-treino-sessao.js?v=205').then(m=>{window.mesaTreinoMod=m.instalarTreinoSessao({db,doc,setDoc,getDoc,getDocs,collection,deleteDoc,ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid,mapaAtual:()=>novaSyncController_?.mapaAtual?.()});}).catch(e=>console.warn('[Treino] sessão indisponível.',e));
import('./mesa-teste-personagem.js?v=205').then(m=>{window.mesaTestePersonagemMod=m.instalarTestePersonagem({db,doc,setDoc,getDoc,getDocs,collection,deleteDoc,ehMestre:()=>userData?.role==='mestre',controller:()=>novaSyncController_,uid:()=>currentUserUid});}).catch(e=>console.warn('[Teste do mapa] indisponível.',e));
import('./mesa-reforma-teste.js?v=204').then(m=>{window.mesaReformaTesteMod=m.instalarReformaTeste({db,doc,setDoc,getDoc,getDocs,deleteDoc,collection,runTransaction,controller:()=>novaSyncController_,uid:()=>currentUserUid,mapas:()=>mapasDB||[],criaturas:()=>criaturasDB||[],npcs:()=>npcsDB||[]});}).catch(e=>console.warn('[Reforma do mapa de teste] indisponível.',e));
import('./mesa-paineis-layout.js').then(m=>m.instalarRegraPaineisMapa(document)).catch(e=>console.warn('[Painéis do mapa]',e));
import('./mesa-equip-visual.js?v=204').then(m=>{window.mesaEquipVisualMod=m.instalarEquipVisual({db,doc,setDoc,getDoc,onSnapshot,runTransaction,controller:()=>novaSyncController_,npcs:()=>npcsDB||[]});}).catch(e=>console.warn('[Equip visual] indisponível.',e));
import('./mesa-nichos.js?v=205').then(m=>{window.mesaNichosMod=m.instalarNichos({});}).catch(e=>console.warn('[Nichos] indisponível; a vida segue sem habitat.',e));
import('./mesa-agua-visual.js?v=205').then(m=>{window.mesaAguaVisualMod=m.instalarAguaVisual({controller:()=>novaSyncController_});}).catch(e=>console.warn('[Água visual] indisponível; a água segue sem profundidade desenhada.',e));
import('./mesa-escuridao.js?v=205').then(m=>{window.mesaEscuridaoMod=m.instalarEscuridao({controller:()=>novaSyncController_});}).catch(e=>console.warn('[Escuridão] indisponível; o subsolo fica sem a luz especial.',e));
import('./mesa-agua-ambiente.js?v=205').then(m=>{window.mesaAguaAmbienteMod=m.instalarAguaAmbiente({controller:()=>novaSyncController_});}).catch(e=>console.warn('[Água ambiente] indisponível; a lagoa segue sem ondulação própria.',e));
import('./mesa-cachoeira.js?v=205').then(m=>{window.mesaCachoeiraMod=m.instalarCachoeira({controller:()=>novaSyncController_});}).catch(e=>console.warn('[Cachoeira] indisponível; a peça segue só com o leito.',e));
import('./mesa-espaco.js?v=205').then(m=>m.instalarEspaco({controller:()=>novaSyncController_})).catch(e=>console.warn('[Espaço] indisponível; colisão segue como antes.',e));
import('./mesa-arte3d.js?v=200').then(m=>{window.mesaArte3dMod=m.instalarArte3d({controller:()=>novaSyncController_});}).catch(e=>console.warn('[Arte 3D] indisponível; miniaturas seguem como antes.',e));
import('./mesa-exploracao.js?v=200').then(m=>{window.mesaExploracaoMod=m.instalarExploracao({db,doc,getDoc,setDoc,runTransaction,ehMestre:()=>userData?.role==='mestre'});}).catch(e=>console.warn('[Exploração] indisponível; site segue normal.',e));
import('./mesa-vida.js?v=205').then(m=>{window.mesaVidaMod=m.instalarVida({db,doc,setDoc,getDoc,deleteDoc,onSnapshot,collection,runTransaction,
 controller:()=>novaSyncController_,ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid,npcs:()=>npcsDB||[],criaturas:()=>criaturasDB||[],mapas:()=>mapasDB||[]});}).catch(e=>console.warn('[Vida] indisponível; site segue normal.',e));
// v137: controle de videogame (Xbox/PlayStation/Steam via Steam Input) para andar e agir no mapa. Módulo à parte.
import('./mesa-controle.js?v=137').then(m=>{window.mesaControleMod=m.instalarControle({controller:()=>novaSyncController_});}).catch(e=>console.warn('[Controle] indisponível; site segue normal.',e));
// v135: tempo do jogo, sono, cápsulas de recuperação e efeitos de itens (lanterna). Módulo à parte.
import('./mesa-relogio.js?v=145').then(m=>{window.mesaRelogioMod=m.instalarRelogio({db,doc,setDoc,getDoc,onSnapshot,runTransaction,
 controller:()=>novaSyncController_,ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid,mapas:()=>mapasDB||[],objetos:()=>objetosMapaDB||[],npcs:()=>npcsDB||[],personagens:()=>userCharacters||[]});}).catch(e=>console.warn('[Relógio] indisponível; site segue normal.',e));
// v132: elenco automático dos mapas (NPCs/criaturas vinculados ao cenário) e reforma da "A Última Bateria". Módulo à parte.
import('./mesa-elenco.js?v=155').then(m=>{window.mesaElencoMod=m.instalarElenco({db,doc,setDoc,getDoc,onSnapshot,republicar:async()=>{if(userData?.role==='mestre'&&estadoCampanhaMestre?.cenarioId&&typeof publicarCampanhaAtual_==='function')await publicarCampanhaAtual_();},
 controller:()=>novaSyncController_,ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid,mapas:()=>mapasDB||[],cenarios:()=>cenariosDB||[],
 objetos:()=>objetosMapaDB||[],itens:()=>itensDB||[],npcs:()=>npcsDB||[],criaturas:()=>criaturasDB||[],personagens:()=>userCharacters||[]});}).catch(e=>console.warn('[Elenco] indisponível; site segue normal.',e));
// v118: Cenário Atual dentro do mapa (📜). Notas do mestre só na conta do mestre. Módulo à parte.
window.mesaCenarioV118_={
 render:()=>{try{renderizarCenarioAtualPublico_();}catch(e){console.warn('v118 render',e);}},
 cenarioMestre:()=>{if(userData?.role!=='mestre')return null;const id=String(estadoCampanhaMestre?.cenarioId||'');let c=id?(cenariosDB||[]).find(x=>String(x.id)===id):null;
  if(!c){const m=String(document.getElementById('novaSyncBoard')?.dataset.mapaVisivel||'');if(m)c=(cenariosDB||[]).find(x=>String(x.mapaId||'')===m)||null;}return c||null;}
};
import('./mesa-cenario-mapa.js?v=120').then(m=>{window.mesaCenarioMapa=m.instalarCenarioNoMapa({db,doc,setDoc,onSnapshot,ehMestre:()=>userData?.role==='mestre',logado:()=>!!currentUserUid,
 render:()=>window.mesaCenarioV118_.render(),cenarioMestre:()=>window.mesaCenarioV118_.cenarioMestre()});}).catch(e=>console.warn('[Cenário no mapa] indisponível; site segue normal.',e));
// v117: conta do mestre (Escudo primeiro, Ficha por último, "Todas as fichas", PDM = NPC de ficha avançada).
window.mesaMestreV117_={limparSelecao(){if(userData?.role!=='mestre')return;currentCharId=null;try{filtroPersonagensMestre_='todos';}catch(_){}try{renderizarListaPersonagens();}catch(e){console.warn('v117 lista',e);}}};
import('./mesa-mestre.js?v=117').then(m=>{window.mesaMestre=m.instalarMestre({ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid,
 personagens:()=>userCharacters||[],npcs:()=>npcsDB||[],criaturas:()=>criaturasDB||[],limparSelecao:()=>window.mesaMestreV117_.limparSelecao()});}).catch(e=>console.warn('[Mestre] indisponível; site segue normal.',e));
// v115: 🎬 Preparar a sessão (mapa + testes + pontos de cada cenário). Ponte + módulo à parte.
window.mesaSessaoV115_={
 cenarios:()=>cenariosDB||[],
 parse:txt=>window.mesaInteracoesMapaV109_?.parse?.(txt)||[],
 hidratarMapa:async id=>{const b=(mapasDB||[]).find(m=>String(m.id)===String(id));return b?await labMapaHidratar_(b):null;},
 async salvarCenario(id,patch){
  if(userData?.role!=='mestre')throw Error('Somente o mestre.');
  await setDoc(doc(db,'cenarios',String(id)),patch,{merge:true});
  const c=(cenariosDB||[]).find(x=>String(x.id)===String(id));if(c)Object.assign(c,patch);
  if(String(estadoCampanhaMestre?.cenarioId||'')===String(id)&&typeof publicarCampanhaAtual_==='function'){try{await publicarCampanhaAtual_();}catch(e){console.warn('v115 publicar',e);}}
 }
};
import('./mesa-sessao.js?v=156').then(m=>{window.mesaSessao=m.instalarSessao({db,doc,getDoc,setDoc,ehMestre:()=>userData?.role==='mestre',api:()=>window.mesaSessaoV115_,mapasApi:()=>window.mesaMapasV110_});}).catch(e=>console.warn('[Sessão] indisponível; site segue normal.',e));
// v110: gerador de mapas (painel 🗺️ do mestre). Ponte + módulo à parte.
window.mesaMapasV110_={
 objetos:()=>objetosMapaDB||[],
 mapas:()=>mapasDB||[],
 render:state=>window.novaSyncRenderMap_({oficina2State:state,larguraM:state.w,alturaM:state.h,pxPorMetro:state.ppm}),
 async salvar({id=null,nome,state,cenaDe}){
  if(!batalhaEhMestre_())throw Error('Somente o mestre pode salvar mapas.');
  const existente=id?(mapasDB||[]).find(m=>String(m.id)===String(id)):null;
  if(!id){id=labMapaSlug_(nome);const b=id;let n=2;while((mapasDB||[]).some(m=>String(m.id)===String(id)))id=`${b}_${n++}`;}
  id=String(id);
  const st=JSON.parse(JSON.stringify({...state,name:nome,mapId:id}));
  const pesados=new Set(['desenhos','objetos','formas','oficina2State','mesaScene','formato','partes','tamanhoSerializado','__local','__carregando']);
  const resto=Object.fromEntries(Object.entries(existente||{}).filter(([k])=>!pesados.has(k)));
  const cab={...resto,id,nome,larguraM:st.w,alturaM:st.h,pxPorMetro:st.ppm,fundo:st.bg,corGrade:st.grid,gradeVisivel:st.showGrid!==false,textura:st.texture,
   criadoPor:existente?.criadoPor||currentUserUid||'',atualizadoEm:new Date().toISOString(),geradoV110:st.geradoV110||null};
  const arquivo=doc(db,'combatesAtivos','mapaMesaSyncCena_'+encodeURIComponent(id));
  let cena=null;try{cena=cenaDe?.(id)||null;}catch(e){console.warn('[Gerador de mapas] cena',e);}
  // v143: o que o mestre moveu/retirou neste mapa continua como ele deixou; móveis sobrepostos são afastados.
  if(cena&&window.mesaFixosV143_?.aplicar){try{cena=window.mesaFixosV143_.aplicar(id,cena,{W:Number(st.w)||28,H:Number(st.h)||14,gerado:!!st.geradoV110})||cena;}catch(e){console.warn('[Fixos]',e);}}
  let salvo=null,comCena=false;
  if(cena){
   try{
    const dados=JSON.parse(JSON.stringify(mapaComCenaOficina(cab,cena)));validarTamanhoOficina(dados);
    await setDoc(doc(db,'mapas',id),dados);
    if(existente?.formato==='partes-v1'&&Number(existente.partes||0))await labMapaApagarPartesAntigas_(id,existente.partes);
    await setDoc(arquivo,cena);
    try{const atual=await getDoc(doc(db,'combatesAtivos','mapaMesaSyncDiretaCena'));if(atual.exists()&&String(atual.data()?.mapId||'')===id)await setDoc(doc(db,'combatesAtivos','mapaMesaSyncDiretaCena'),cena);}catch(e){console.warn('[Gerador de mapas] cena atual',e);}
    salvo=dados;comCena=true;
   }catch(e){console.warn('[Gerador de mapas] cena grande demais; salvando só o desenho.',e);}
  }
  if(!salvo){
   // v194: map803* mora na IIFE do arquivo 17 — app.js é módulo, então nome bare não resolve; vem via window.
   const slim=await window.map803EstadoSlim_(st,id);
   const dados={...cab,pxPorMetro:slim.state.ppm,desenhos:[],formas:[],objetos:window.map803LegacyRefs_(slim.state),oficina2State:slim.state,formatoObjetos:window.MAP803_REF_VERSION_,oficina2:true};
   salvo=await labMapaSalvarFirestore_(dados,existente?.formato==='partes-v1'?Number(existente.partes||0):0);
   try{await deleteDoc(arquivo);}catch(_){}
  }
  const ix=(mapasDB||[]).findIndex(m=>String(m.id)===id);if(ix>=0)mapasDB[ix]=salvo;else mapasDB.push(salvo);
  try{labAtualizarSelectMapas_();}catch(_){}try{gm2populateMapSelect();}catch(_){}try{renderizarBancoMapas_();}catch(_){}
  return {id,comCena};
 }
};
import('./mesa-mapas-ui.js?v=141').then(m=>{window.mesaGeradorMapas=m.instalarGeradorMapas({ehMestre:()=>userData?.role==='mestre',api:()=>window.mesaMapasV110_});}).catch(e=>console.warn('[Gerador de mapas] indisponível; site segue normal.',e));
// v109: interações no mapa (pontos de investigação e comércio clicando no NPC). Módulo à parte.
import('./mesa-interacoes.js?v=156').then(m=>{window.mesaInteracoes=m.instalarInteracoesMapa({db,doc,setDoc,onSnapshot,
 ehMestre:()=>userData?.role==='mestre',cenarios:()=>cenariosDB,api:()=>window.mesaInteracoesMapaV109_||null});}).catch(e=>console.warn('[Interações no mapa] indisponível; site segue normal.',e));
// v107: novo visual (desenhado) dos objetos do mapa. Módulo à parte.
import('./mesa-arte-ui.js?v=151').then(m=>{window.mesaArteObjetos=m.instalarArteObjetos({db,doc,setDoc,getDoc,storage,ref,uploadBytes,getDownloadURL,
 ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid,objetosMapa:()=>objetosMapaDB,
 aoConcluir:()=>{try{renderizarBancoObjetosMapa_();}catch(_){}}});}).catch(e=>console.warn('[Arte dos objetos] indisponível; site segue normal.',e));
// v105: miniaturas vistas de cima (editor na ficha e painéis no Banco). Módulo à parte.
import('./mesa-miniaturas-ui.js?v=108').then(m=>{window.mesaMiniaturas=m.instalarMiniaturas({db,doc,setDoc,runTransaction,storage,ref,uploadBytes,getDownloadURL,
 ehMestre:()=>userData?.role==='mestre',uid:()=>currentUserUid,personagemAtual:()=>{try{return obterPersonagemAtual_();}catch(_){return null;}},
 criaturas:()=>criaturasDB,npcs:()=>npcsDB,personagens:()=>userCharacters,notificar:(t,k)=>{try{notificar_(t,k||'aviso',4500);}catch(_){alert(t);}}});}).catch(e=>console.warn('[Miniaturas] indisponível; site segue normal.',e));
// v132: raio da tempestade atinge alguém (dano elétrico 2d6 numa parte do corpo, ignora armadura)
window.mesaRaioV132_={async atingir(t,estadoSaude,mapa,opc={}){const expr=String(opc.dano||'2d6'),nomeDano=String(opc.nome||'Raio da tempestade');
 const c=await novaFicha_(t),W=Number(mapa?.larguraM)||28,H=Number(mapa?.alturaM)||14;
 const alvo={...t,...structuredClone(estadoSaude||{}),charLab:structuredClone(c),diametroM:Number(t.diametroM)>0?Number(t.diametroM):1,acoesAtuaisLab:3};
 alvo.x*=W/28;alvo.y*=H/14;
 const estado={...labEstado_,tokens:[alvo],objetosLab:[],log:[]};let dano=null,total=0;
 labComContextoLocal_(estado,false,()=>{labGarantirSnapshotCombate_(alvo);total=Math.max(1,Math.round((Number(rolarExpressaoDanoCombate_(expr)?.total)||0)*(Number(opc.fator)||1)));dano=labAplicarDanoLocal_(alvo,total,{nome:nomeDano,dano:expr,categoria:'natural',natural:true},{ignorarArmadura:opc.ignorarArmadura!==false});});
 return {combateLab:alvo.combateLab,dano,total};
}};
function chaveArmaV125_(it){return String(it?.instanciaId||it?.idBanco||it?.id||getNome(it)||'');}
async function novaFicha_(t){
 const legacy=(labEstado_?.tokens||[]).find(x=>String(x.id)===String(t.id));
 let c=batalhaCharLocal_(t.id)||legacy?.charLab;
 const source=decodeURIComponent(t.id);
 if(source.startsWith('syncnpc:')){
  const model=npcBancoPorId_(source.slice(8).split('~')[0]);c=criarNPCCombateDoBanco_(model,t?.atributosIndividuo?{id:t.id,atributosIndividuo:t.atributosIndividuo}:null);
  if(c&&model){
   const linked=Object.values(mapaPericiaAtaques_(model)).flat();
   c.armasNaturais=(criarCriaturaCombateDoBanco_(model)?.armasNaturais||[]).filter(w=>ataqueNaturalPorNome_(w.nome)||linked.includes(normalizarTextoCombate_(w.nome))||/mordida|garras|cauda|pres[a-z]*|tent[a-z]*|coice/i.test(w.nome));
  }
 }
 if(source.startsWith('synccriatura:')){
  const model=criaturaBancoPorId_(source.slice(13).split('~')[0]),ref=doc(db,'combatesAtivos','mapaMesaSyncCriaturas');
  // v119: várias criaturas pedem o mesmo documento ao mesmo tempo → uma leitura só (1,5 s)
  let saved=(await novaInstanciasV119_()).data()?.instances?.[t.id];if(!saved)novaInstCacheV119_.p=null;
  if(!saved&&batalhaEhMestre_())saved=await runTransaction(db,async tx=>{const snap=await tx.get(ref),data=snap.data()||{instances:{}},old=data.instances?.[t.id];if(old)return old;const created={atributos:atributosIndividuoDoModelo_(model,null,'criatura'),modelId:model.id};tx.set(ref,{...data,instances:{...data.instances,[t.id]:created}});return created;});
  if(!saved)throw Error('Aguardando o mestre preparar os atributos da criatura.');
  c=aplicarTreinos(criarCriaturaCombateDoBanco_(model,{id:t.id,atributosIndividuo:saved.atributos}),model,novaBaseCriatura_,npcIdPericiaSistema_);
 }

 if(!String(t.id).startsWith('dummy:')&&!c?.__npcTemporario&&!c?.__criaturaTemporaria){
  const snap=await novaFichaDocV119_(source);if(snap.exists())c={id:t.id,...snap.data()};
 }
 if(!c)throw new Error('Ficha não encontrada para '+t.nome);
 if(source==='teste_jogador_v138'&&c.testeV138&&!c.equipCompativelV216&&userData?.role==='mestre'&&itensDB?.length&&especializacoesDB?.length)c=await ajustarEquipamentoKaelV216_(c);
 return c;
}
var novaInstCacheV119_={p:null,t:0},novaFichaCacheV119_=new Map();
/* v205: ficha usada pelo combate: a real, ou a CÓPIA da sessão quando há um duelo de treino com esse personagem (js/mesa-treino-sessao.js) */
function rotaFichaV205_(p){try{return globalThis.mesaTreinoRotaV205?.(p)||p;}catch(_){return p;}}
function novaInstanciasV119_(){if(!novaInstCacheV119_.p||Date.now()-novaInstCacheV119_.t>1500){novaInstCacheV119_.p=getDoc(doc(db,'combatesAtivos','mapaMesaSyncCriaturas'));novaInstCacheV119_.t=Date.now();novaInstCacheV119_.p.catch(()=>{novaInstCacheV119_.p=null;});}return novaInstCacheV119_.p;}
function novaFichaDocV119_(id){const k=String(id),c=novaFichaCacheV119_.get(k);if(c&&Date.now()-c.t<1500)return c.p;const p=getDoc(doc(db,...rotaFichaV205_('personagens/'+k).split('/')));novaFichaCacheV119_.set(k,{p,t:Date.now()});p.catch(()=>novaFichaCacheV119_.delete(k));return p;}
function novaEquipamentos_(c,per){
 if(c.__novaCriatura){const natural=(c.armasNaturais||[]).filter(w=>npcIdPericiaSistema_(periciaDoAtaque(getNome(w),c.vinculosAtaquesPericias))===per.id);if(natural.length)return natural.map(item=>({valor:'natural:'+item.id,rotulo:item.nome,item,graus:0}));}
 let list=batalhaEquipamentos_(c,per);
 if(c.__novaCriatura)return list.filter(w=>!w.item?.natural);
 if((c.__npcTemporario||c.__criaturaTemporaria)&&periciaCriaturaPodeAtacar_(c,per)&&c.armasNaturais?.length&&!list.some(w=>w.item?.natural)&&!/tiro|disparo|distancia|laser|rifle/i.test(normalizarTextoCombate_(getNome(per)))){
  list=ataquesNaturaisChar_(c).map(item=>({valor:'natural:'+item.id,rotulo:item.nome,item,graus:0}));
 }
 return list.sort((a,b)=>(a.graus||0)-(b.graus||0)||a.rotulo.localeCompare(b.rotulo,'pt-BR'));
}
function novaArmaAtivaDefensor_(char,token){
 if(!char)return null;
 const explicit=token&&Object.prototype.hasOwnProperty.call(token,'activeWeaponId')?String(token.activeWeaponId||''):'';
 if(token&&Object.prototype.hasOwnProperty.call(token,'activeWeaponId')){
  if(!explicit||/^natural:|^(desarmado|nenhum)$/i.test(explicit))return null;
  const item=encontrarEquipamentoCombateChar_(char,explicit);
  return item&&itemEhArmaOuEscudo_(item)&&!itemCombateInutilizavel_(item)?item:null;
 }
 const legacy=String(batalhaPrefsDefensor_(char)?.equipamento||'');
 if(legacy&&!/^natural:|^(desarmado|nenhum)$/i.test(legacy)){
  const item=encontrarEquipamentoCombateChar_(char,legacy);
  if(item&&itemEhArmaOuEscudo_(item)&&!itemCombateInutilizavel_(item))return item;
 }
 return (obterItensEquipados_(char)||[]).find(item=>item&&itemEhArmaOuEscudo_(item)&&!itemCombateInutilizavel_(item))||null;
}
function novaValorPericiaTotal_(c,per){
 if(!c||!per)return 0;
 // Testes de Resistência que pedem a perícia inteira não sofrem os redutores
 // situacionais de ferimento, fadiga, queda, armadura ou efeitos temporários.
 return Math.min(100,Math.max(0,Number(obterValorRegistroPericia_(c,per.id,!!per.__especializacao))||0));
}
function novaDetalharValorPericia_(c,t,per,penalty=0){
 const raw=novaValorPericiaTotal_(c,per),arm=valorPericiaComArmadura_(c,per,raw);
 const escudoEquipado=(obterItensEquipados_(c)||[]).some(item=>/escudo|shield/i.test(getNome(item)));
 const grausFerimento=Math.max(batalhaPenalidadeFerimento_(c,per),labPenalidadeFerimentoLab22_(t,per));
 const grausCaido=batalhaPenalidadeCaido_(c),grausInfeccao=batalhaPenalidadeInfeccao_(c),grausCompatibilidade=Math.max(0,Number(penalty)||0);
 const extra=grausFerimento+grausCaido+grausInfeccao+grausCompatibilidade;
 const effects=Object.values(t.psiEffects||{}).filter(e=>e.untilRound>(t.supportRound||0)),debuff=effects.reduce((s,e)=>s+Number(e.penalty||0),0);
 const agile=t.psiEffects?.agilidade_psi,bonus=agile?.untilRound>(t.supportRound||0)&&/atlet|acrob|desarmad/i.test(per.id+' '+getNome(per))?Number(agile.bonus||0):0;
 const ajuste=aplicarDificuldadeEFadiga_(c,arm.valor,'padrao',extra),aposDificuldade=Number(ajuste.valor||0);
 // Campo legado das versões anteriores ao dano estrutural por PV. Ele ainda é
 // lido para não alterar silenciosamente combates em andamento, mas agora fica
 // identificado no histórico em vez de desaparecer em “outros modificadores”.
 const armaDanificadaLegado=periciaCriaturaPodeAtacar_(c,per)?Math.max(0,Number(t.combateLab?.armaDanificadaPenalidade||0)):0;
 const escudo=escudoEquipado?5:0,intuicao=Number(t.psiIntuition||0);
 // v200: ficha rápida da criatura/NPC (balão do mapa): bônus de ataque e de defesa em pontos percentuais
 const fichaRapida=periciaCriaturaPodeAtacar_(c,per)?Number(t.bonusAtaqueV200||0):(/esquiv|bloque|defes|parry/i.test(per.id+' '+getNome(per))?Number(t.bonusDefesaV200||0):0);
 const valor=Math.min(100,Math.max(0,aposDificuldade-escudo-debuff-armaDanificadaLegado+bonus+intuicao+fichaRapida));
 return {valor,raw,armaduraPct:Number(arm.pct||0),armaduraValor:Number(arm.valor||0),ajuste,aposDificuldade,
  grausFerimento,grausCaido,grausInfeccao,grausCompatibilidade,escudo,debuff,armaDanificadaLegado,
  bonusAgilidade:bonus,bonusIntuicao:intuicao,fadiga:String(c?.combate?.fadiga||'Fresh')};
}
function novaValorPericia_(c,t,per,penalty=0){return novaDetalharValorPericia_(c,t,per,penalty).valor;}
function novaDescreverTesteAtaque_(d,die){
 const etapas=[`base ${d.raw}`];let atual=d.raw;
 if(d.armaduraPct>0&&d.armaduraValor!==atual){atual=d.armaduraValor;etapas.push(`armadura −${Number(d.armaduraPct.toFixed(1))}% → ${atual}`);}
 if(d.aposDificuldade!==atual){
  const causas=[];
  if(Number(d.ajuste?.degrausFadiga||0)>0)causas.push(`fadiga ${traduzirNomeFadiga_(d.fadiga)} → ${d.ajuste?.efetiva?.nome||'dificuldade maior'}`);
  if(d.grausCompatibilidade>0)causas.push(`compatibilidade +${d.grausCompatibilidade} grau${d.grausCompatibilidade>1?'s':''}`);
  if(d.grausFerimento>0)causas.push(`ferimento +${d.grausFerimento} grau${d.grausFerimento>1?'s':''}`);
  if(d.grausCaido>0)causas.push(`caído +${d.grausCaido} graus`);
  if(d.grausInfeccao>0)causas.push(`infecção +${d.grausInfeccao} grau`);
  if(Number(d.ajuste?.modificadorMestre||0)!==0)causas.push(`mestre ${Number(d.ajuste.modificadorMestre)>0?'+':''}${d.ajuste.modificadorMestre} grau(s)`);
  atual=d.aposDificuldade;etapas.push(`${causas.join(', ')||('dificuldade '+(d.ajuste?.efetiva?.nome||''))} → ${atual}`);
 }
 const aditivos=[
  ['escudo',-d.escudo],['efeito psíquico',-d.debuff],['arma danificada (legado)',-d.armaDanificadaLegado],
  ['Agilidade Psi',d.bonusAgilidade],['Intuição',d.bonusIntuicao],[d.nomeAtitude||'atitude',Number(d.bonusAtitude)||0]
 ];
 for(const [nome,delta] of aditivos){if(!delta)continue;atual=Math.max(0,Math.min(100,atual+delta));etapas.push(`${delta>0?'+':'−'}${Math.abs(delta)} ${nome} → ${atual}`);}
 etapas.push(`efetiva ${d.valor}`);if(die!==null)etapas.push(`${die}/${d.valor}`);return etapas.join(' · ');
}
function novaPericiaDaArma_(c,weaponId,requested=''){
 const ops=[];for(const per of batalhaListaPericias_(c)||[]){if(!periciaCriaturaPodeAtacar_(c,per))continue;for(const w of novaEquipamentos_(c,per)){if(w.valor===weaponId)ops.push({per,w,base:novaValorPericiaTotal_(c,per)});}}
 const diretas=ops.filter(o=>!o.w.graus),list=diretas.length?diretas:ops;
 list.sort((a,b)=>(diretas.length?0:(a.w.graus||0)-(b.w.graus||0))||b.base-a.base);
 return diretas.length?list[0]:(list.find(o=>batalhaTokenPericia_(o.per)===requested)||list[0])||null;
}
async function novaPrepararAtaque_(a,b,command){
 const objectTarget=command.targetKind==='object';
 const [ca,cb]=await Promise.all([novaFicha_(a),objectTarget?Promise.resolve({}):novaFicha_(b)]);
 const targetSource=objectTarget?'':decodeURIComponent(String(b.id||''));
 const targetSheetPath=!objectTarget&&!targetSource.startsWith('sync')&&!targetSource.startsWith('dummy:')?(globalThis.mesaTreinoRotaV205?.('personagens/'+targetSource)||'personagens/'+targetSource):null;
 const psi=command.powerId==='grito_psiquico'?novaInfoSuporte_(ca,a).powers.find(p=>p.id==='grito_psiquico'):null;
 if(command.powerId&&!psi)throw Error('Poder não disponível nesta ficha.');
 const automatico=psi?null:novaPericiaDaArma_(ca,command.weaponId,command.skillId);
 const per=psi?{id:'grito_psiquico',nome:'Psiquismo'}:automatico?.per;
 if(!per||(!psi&&!periciaCriaturaPodeAtacar_(ca,per)))throw Error('Selecione uma perícia de ataque.');
 const chosen=psi?{graus:0,item:{id:'grito_psiquico',nome:'Grito Psíquico',natural:true,alcanceMetros:8,dano:'0'}}:automatico?.w;
 if(!chosen?.item)throw Error('Arma ou ataque natural indisponível.');
 const seed=Number.isInteger(command.seed)?command.seed:crypto.getRandomValues(new Uint32Array(1))[0];
 const cone=psi?{range:8,angle:60,centralPenalty:20,name:'Grito Psíquico'}:/eco[ _]da[ _]matilha/i.test(getNome(chosen.item))?{range:15,angle:60,centralPenalty:20}:(it=>{/* v132: cone a partir do atacante (Trombeta, sopros…) */const ps=(Array.isArray(it?.propriedades)?it.propriedades:String(it?.propriedades||'').split(/[,;]/)).map(x=>String(x).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'_'));return ps.some(p=>/^(cone|cone_sonoro|area|area_cone|sopro|baforada)$/.test(p))?{range:Math.max(3,Number(it.alcanceMetros)||10),angle:60,centralPenalty:20,name:String(it.nome||'Ataque em área')}:null;})(chosen.item);
 if(objectTarget&&cone)throw Error('Este ataque sonoro afeta criaturas, não objetos.');
 const resolve=(a,b,health,map,decision={phase:'resolve',choice:'none'},scene=null,freshTargetSheet=null)=>{
  const defenderChar=!objectTarget&&freshTargetSheet?{...structuredClone(cb),...structuredClone(freshTargetSheet)}:structuredClone(cb);
  const actor={...a,...structuredClone(health[a.id]||{}),charLab:structuredClone(ca),diametroM:Number(a.diametroM)>0?Number(a.diametroM):(/besta\s+ululante/i.test(a.nome)?2.4:1),acoesAtuaisLab:3};
  const target={...b,...structuredClone(health[b.id]||{}),charLab:defenderChar,diametroM:Number(b.diametroM)>0?Number(b.diametroM):(/besta\s+ululante/i.test(b.nome)?2.4:1),acoesAtuaisLab:3};
  const modoA=perfilAtitudeRT_(actor,map.rtContext,map),modoB=perfilAtitudeRT_(target,map.rtContext,map);if(map.rtContext)exigirAtitudeRT_(actor,map.rtContext,map);
  actor.supportRound=target.supportRound=map.combat?.round||0;
  for(const t of [actor,target]){t.x*=Number(map.larguraM||28)/28;t.y*=Number(map.alturaM||14)/14;}
  const state={...labEstado_,tokens:[actor,target],objetosLab:[],log:[]};
  const originalRandom=Math.random;let randomState=seed;
  Math.random=()=>{randomState=(Math.imul(1664525,randomState)+1013904223)>>>0;return randomState/4294967296;};
  try{return labComContextoLocal_(state,false,()=>{
   const healthA=labGarantirSnapshotCombate_(actor),healthB=objectTarget?{}:labGarantirSnapshotCombate_(target),item=structuredClone(chosen.item);
   if(objectTarget)danoObjeto(b,0);
   if(healthA.morto||healthA.inconsciente||healthA.incapacitado)throw Error('Este personagem não pode atacar neste estado.');
   {const caida=actor.combateLab?.armaCaida;if(caida&&!caida.recuperada&&chaveArmaV125_(item)===String(caida.key))throw Error('Sua arma ('+(caida.nome||'arma')+') está no chão. Pegue de volta pelo ícone no mapa ou use outro ataque.');}
   if(ocupado(actor,map.combat))throw Error('Este turno está dedicado a Primeiros Socorros. Apenas defesas são permitidas.');
   if((healthA.caido||healthA.derrubado)&&!cone&&!labAtaqueEhDistancia_(item))throw Error('Gaste uma ação para levantar antes de atacar corpo a corpo.');
   if(healthB.morto)throw Error('O alvo já está morto.');
 const distance=objectTarget?distanciaObjeto(a,b,map):Math.max(0,labDistanciaEntre_(actor,target)-(actor.diametroM+target.diametroM)/2),range=cone?.range||labAlcanceAtaque_(actor,item);
 if(!labAtaqueEhDistancia_(item)&&distance>range+.001)throw Error(`Fora de alcance: ${distance.toFixed(2)} m (alcance ${range.toFixed(2)} m).`);
   if(distance>range+.001)throw Error('Fora de alcance: '+distance.toFixed(1)+' m; alcance '+range.toFixed(1)+' m.');
   if(!cone&&labAtaqueEhDistancia_(item)&&linhaBloqueadaPorObjetos(a,b,map,scene?.objects||[],{camada:3,ignorarIds:objectTarget?[b.id]:[]}))
    throw Error('Linha de tiro bloqueada por uma barreira no mesmo nível.');
   if(labEhArmaMuniciada_(item)&&labMunicaoAtual_(actor,item)<=0)throw Error('Arma sem munição.');
   const psiInfo=psi?novaInfoSuporte_(ca,actor):null,psiCost=psi?Number(command.cost??psi.cost):0;
   if(psi&&(!Number.isInteger(psiCost)||psiCost<psi.cost||psiCost>psiInfo.psiMax-Number(actor.psiSpent??psiInfo.psiSpent)))throw Error('PP insuficientes ou custo inválido.');
   const ataqueDetalhe=psi?null:novaDetalharValorPericia_(ca,actor,per,chosen.graus||0);
   const value=Math.max(0,(psi?psi.value:ataqueDetalhe.valor)+modoA.ataque-((healthA.caido||healthA.derrubado)?30:0)),attackRoll=testeComSorte(actor,value,max=>1+Math.floor(Math.random()*max)),die=attackRoll.die,grade=attackRoll;
   const ataqueDescricao=psi?novaDescreverTeste_(psi.value,value,die):novaDescreverTesteAtaque_({...ataqueDetalhe,valor:value,bonusAtitude:modoA.ataque,nomeAtitude:modoA.nome},die);
   if(objectTarget){
    const expr=labExpressaoDano_(actor,item),rolled=grade.sucesso?(grade.grau==='Crítico'?maximizarExpressaoDanoCombate_(expr):rolarExpressaoDanoCombate_(expr)):{total:0};
    if(!rolled||!Number.isFinite(rolled.total))throw Error('Dano inválido no cadastro da arma: '+expr);
    const nrmV135=x=>String(x||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''),ferrV135=(n=>/machad|\baxe\b/.test(n)?'machado':/picaret|pickaxe/.test(n)?'picareta':'')(nrmV135(item?.nome||item?.name||'')),matV135=nrmV135([b.material,b.nome,b.modeloId].join(' ')),certaV135=ferrV135==='machado'&&/madeir|wood|arvore|tronco|tabua|caixote|barril|\bbau\b|cerca|palha|mesa|cadeira|porta/.test(matV135)||ferrV135==='picareta'&&/pedra|rocha|cristal|concreto|minerio|tijolo|muro|gelo|entulho/.test(matV135); // v135: ferramenta certa ignora a dureza e faz +50%
    const damage=danoObjeto(b,Math.round(rolled.total*(certaV135?1.5:1)),obterPenetracaoArma_(item)+(certaV135?Number(b.dureza)||0:0));if(grade.sucesso)ignicao(damage.object,item,grade.grau==='Crítico',map.combat);labConsumirMunicao_(actor,item,1);
    const text=actor.nome+' → '+b.nome+': '+getNome(per)+' · '+getNome(item)+' · '+ataqueDescricao+' · '+grade.grau+(grade.sorte?' · 🍀 Sorte':'')+(grade.grau==='Crítico'?' · Crítico: dano máximo':'');
    const message=text+(certaV135&&grade.sucesso?' · '+(ferrV135==='machado'?'🪓 machado na madeira':'⛏️ picareta na pedra'):'')+(grade.sucesso?' · dano bruto '+damage.bruto+' · dureza '+damage.dureza+' − penetração '+damage.penetracao+' = '+damage.efetiva+' · dano '+damage.dano+' · PV '+damage.object.pvAtual+'/'+damage.object.pvMax+(damage.object.destruido?' · Objeto destruído':''):' · Não atingiu o objeto');
    if(damage.object.pegandoFogo)damage.object.estadoFogo=damage.object.estadoFogo||{};
    return {object:damage.object,actors:{[a.id]:{luckPrepared:!!actor.luckPrepared,psiIntuition:0,combateLab:actor.combateLab,municaoLab:actor.municaoLab||{}}},event:{message,attackerMessage:message,damage:damage.dano,grade:grade.grau,hit:grade.sucesso,item:{nome:getNome(item),categoria:item.categoria||'',familia:item.familia||'',tipo:item.tipo||''}}};
   }
   // O ataque em área compartilha o acerto, mas cada vítima rola sua própria defesa e dano.
   if(cone)for(const char of String(b.id))randomState=(Math.imul(randomState^char.charCodeAt(0),16777619))>>>0;
   const facing=Number.isFinite(b.facing)?b.facing:0;
   const attackAngle=Math.atan2(actor.y-target.y,actor.x-target.x);
   // Atacar também orienta automaticamente a miniatura para o alvo, como o
   // movimento normal. Isso impede que um ataque comum seja resolvido de costas.
   const actorAttackFacing=Math.atan2(target.y-actor.y,target.x-actor.x);
   actor.facing=actorAttackFacing;
   let rearDelta=attackAngle-facing;while(rearDelta>Math.PI)rearDelta-=Math.PI*2;while(rearDelta<-Math.PI)rearDelta+=Math.PI*2;
   const fromBack=Math.abs(rearDelta)>Math.PI/2;
   const evasionActive=!!(target.combateLab?.evasao||target.combateLab?.manobraEvasao||target.charLab?.evasao||target.charLab?.manobraEvasao);
   const options=[];
   if(map.combat?.active&&defesasRestantes(map.combat,b.id)>0&&!healthB.morto&&!healthB.inconsciente&&!healthB.incapacitado){
   const defenses=batalhaListaPericiasDefesa_(cb);
    const shieldEquipped=(obterItensEquipados_(cb)||[]).some(w=>/escudo|shield/i.test(getNome(w)));
    if(!defenses.some(labEhEsquivaD7_)){const dodge=batalhaListaPericias_(cb).find(labEhEsquivaD7_);if(dodge)defenses.unshift(dodge);}
    for(const defensePer of defenses){
     if(labEhEsquivaD7_(defensePer)){
      const dodgePenalty=(fromBack&&!evasionActive?20:0)+(cone&&b.id===command.targetId?cone.centralPenalty:0);
      options.push({id:batalhaTokenPericia_(defensePer),nome:'Esquiva',base:Math.min(100,obterValorRegistroPericia_(cb,defensePer.id,!!defensePer.__especializacao)),valor:Math.max(0,novaValorPericia_(cb,target,defensePer)-dodgePenalty+(shieldEquipped?5:0))});
     }
     else if(!cone&&!fromBack&&!labAtaqueEhDistancia_(item))for(const weapon of novaEquipamentos_(cb,defensePer)){
      const shield=/escudo|shield/i.test(getNome(weapon.item));
      if(labAtaqueEhDistancia_(weapon.item)||labAlcanceAtaque_(target,weapon.item)+.001<distance)continue;
      if(labAtaqueEhDistancia_(item)&&!shield)continue;
      if(weapon.item.inutilizavel||weapon.item.pvAtual===0)continue;
      options.push({id:batalhaTokenPericia_(defensePer)+'|'+weapon.valor,nome:'Aparar ('+getNome(weapon.item)+')',valor:Math.max(0,novaValorPericia_(cb,target,defensePer,weapon.graus||0)-(shield?0:20)+(shield?5:0))});
     }
    }
   }
   if(!cone&&!labAtaqueEhDistancia_(item)&&fromBack&&map.combat?.active&&defesasRestantes(map.combat,b.id)>0&&!healthB.morto&&!healthB.inconsciente&&!healthB.incapacitado){
    const tail=(ataquesNaturaisChar_(cb)||[]).find(w=>/cauda|calda|rabo|tail/i.test(getNome(w)))||(/besta\s+ululante/i.test(b.nome)?{nome:'Cauda',natural:true,alcanceMetros:2}:null);
    const attackSkill=(batalhaListaPericias_(cb)||[]).filter(p=>periciaCriaturaPodeAtacar_(cb,p)).sort((p,q)=>novaValorPericia_(cb,target,q)-novaValorPericia_(cb,target,p))[0];
    if(tail&&attackSkill&&!tail.inutilizavel&&tail.pvAtual!==0&&distance<=labAlcanceAtaque_(target,tail))options.push({id:'natural:aparar-cauda',nome:'Aparar com cauda',valor:Math.max(0,novaValorPericia_(cb,target,attackSkill)-20)});
   }
   if(healthB.caido||healthB.derrubado)options.length=0;
   if(ocupado(target,map.combat))for(const option of options){option.valor=Math.max(0,option.valor-20);}
   for(const o of options){const dp=(batalhaListaPericias_(cb)||[]).find(p=>o.id.startsWith(batalhaTokenPericia_(p)))||((o.id==='natural:aparar-cauda')?(batalhaListaPericias_(cb)||[]).filter(p=>periciaCriaturaPodeAtacar_(cb,p)).sort((p,q)=>novaValorPericia_(cb,target,q)-novaValorPericia_(cb,target,p))[0]:null);o.base=o.base??(dp?Math.min(100,obterValorRegistroPericia_(cb,dp.id,!!dp.__especializacao)):o.valor);o.modifiers=[];if(ocupado(target,map.combat))o.modifiers.push({name:'primeiros socorros',value:-20});if(cone&&b.id===command.targetId)o.modifiers.push({name:'centro do cone',value:-cone.centralPenalty});{const pz=target.postura||(target.combateLab?.caido||target.combateLab?.derrubado?'caido':''),longe=!!cone||labAtaqueEhDistancia_(item);if(pz==='agachado'&&longe){o.modifiers.push({name:'agachado',value:10});o.valor=Math.min(100,o.valor+10);}if((pz==='rastejando'||pz==='caido')&&longe){o.modifiers.push({name:pz==='caido'?'caído (alvo baixo)':'rastejando (alvo baixo)',value:20});o.valor=Math.min(100,o.valor+20);}if((pz==='rastejando'||pz==='caido')&&!longe){o.modifiers.push({name:pz==='caido'?'caído':'rastejando',value:-20});o.valor=Math.max(0,o.valor-20);}}if(o.nome.startsWith('Esquiva')&&fromBack&&!evasionActive)o.modifiers.push({name:'pelas costas',value:-20});if(o.nome.startsWith('Aparar')&&!((obterItensEquipados_(cb)||[]).some(w=>/escudo|shield/i.test(getNome(w)))))o.modifiers.push({name:'aparar sem escudo',value:-20});if(modoB.defesa){o.modifiers.push({name:modoB.nome,value:modoB.defesa});o.valor=Math.max(0,Math.min(100,o.valor+modoB.defesa));}}
   if(decision.phase==='preview'&&grade.sucesso&&options.length)return {pending:{options,ranged:!!cone||labAtaqueEhDistancia_(item),cone:!!cone,fromBack,remaining:defesasRestantes(map.combat,b.id)}};
   let defense=null;
   if(decision.choice&&decision.choice!=='none'){
    const option=options.find(o=>o.id===decision.choice);if(!option)throw Error('Esta defesa não está mais disponível.');
    const dr=testeComSorte(target,option.valor,max=>1+Math.floor(Math.random()*max));defense={...option,...dr};
   }
   const hit=ataqueSuperaDefesa({grau:grade.grau,valor:value,die},defense);
   const critical=grade.grau==='Crítico',melee=!cone&&!labAtaqueEhDistancia_(item),failedDefense=!defense||!defense.sucesso;
   const locations=novaLocaisValidos_(healthB),eligible=hit&&!cone&&failedDefense;
   // Danificar Arma só é uma escolha válida quando conseguimos identificar uma
   // arma/escudo realmente empunhado e com PV estrutural. O painel direto
   // sincroniza activeWeaponId; fichas antigas ainda usam o fallback equipado.
   const activeDefenderWeapon=novaArmaAtivaDefensor_(defenderChar,b);
   const damageableDefenderWeapon=activeDefenderWeapon&&Number(activeDefenderWeapon.pv||0)>0?activeDefenderWeapon:null;
   const effectOptions=eligible?labEfeitosDisponiveis_({item,grauAtaque:grade.grau,defensorId:b.id,atacanteId:a.id}).filter(e=>e.id!=='escolher_localizacao'&&(e.id!=='danificar_arma'||!!damageableDefenderWeapon)):[];
   // v125: Desarmar — a arma empunhada do defensor cai no chão (vira um item solto no mapa).
   if(eligible&&activeDefenderWeapon&&!objectTarget)effectOptions.push({id:'desarmar',nome:'🫳 Desarmar (a arma cai no chão)'});
   const chooseLocal=hit&&!cone&&failedDefense&&(critical||melee),maxEffects=Math.min(effectOptions.length,labEfeitosQuantidade_(grade.grau,defense?.grau||'Falha',!defense));
   if(eligible&&(chooseLocal||effectOptions.length)&&!decision.effectsConfirmed)return {effectsPending:{type:'effects',options:effectOptions,locations:chooseLocal?locations:[],maxEffects,critical,attackText:ataqueDescricao,defenseText:defense?novaDescreverTeste_(defense.base,defense.valor,defense.die,defense.modifiers):'Sem defesa'}};
   const especiais=Array.isArray(decision.effects)?decision.effects:[];
   if(new Set(especiais).size!==especiais.length||especiais.length>maxEffects||especiais.some(id=>!effectOptions.some(e=>e.id===id)))throw Error('Efeito especial indisponível para este ataque.');
   if(decision.local&&(!chooseLocal||!locations.includes(decision.local)))throw Error('Localização indisponível para este golpe.');
   labConsumirMunicao_(actor,item,1);
   let damage=null,weaponDamage=null,targetSheetPatch=null;
   if(hit){
    const eco=!!psi||/eco[ _]da[ _]matilha/i.test(getNome(item));
    if(!eco){
     const expr=labExpressaoDano_(actor,item),rolled=grade.grau==='Crítico'?maximizarExpressaoDanoCombate_(expr):rolarExpressaoDanoCombate_(expr);
     if(!rolled)throw Error('Dano inválido no cadastro da arma: '+expr);
     const absorbed=Math.min(Number(target.psiAbsorption||0),rolled.total);target.psiAbsorption=Math.max(0,Number(target.psiAbsorption||0)-absorbed);
     const incoming=Math.max(0,Number(rolled.total||0)-absorbed);
     if(especiais.includes('danificar_arma')){
      if(!damageableDefenderWeapon)throw Error('O defensor não possui uma arma empunhada que possa receber este efeito.');
      const result=novaAplicarDanoArma_(damageableDefenderWeapon,incoming);
      Object.assign(damageableDefenderWeapon,result.item);
      weaponDamage={nome:getNome(damageableDefenderWeapon)||'Arma',bruto:result.bruto,pa:result.pa,estrutural:result.estrutural,aplicado:result.aplicado,excesso:result.excesso,pvAntes:result.pvAntes,pvAtual:result.pvAtual,pvMax:result.pvMax,quebrada:result.pvAtual<=0};
      // Para personagens persistentes, o PV da arma pertence à ficha e precisa
      // ser salvo na mesma transação que resolve o golpe. Assim não existe um
      // intervalo em que a interface mostre a arma quebrada mas o Firestore não.
      if(targetSheetPath)targetSheetPatch={inventario:structuredClone(defenderChar.inventario)};
      // Só o dano estrutural que ultrapassa os PV restantes da arma chega ao
      // corpo. Pela regra da Mesa Estelar, esse excedente acerta o Braço Direito.
      if(result.excesso>0){
       if(!locations.length)throw Error('O alvo não possui partes atingíveis.');
       damage=labAplicarDanoLocal_(target,result.excesso,item,{localForcada:'Braço Direito',ignorarArmadura:especiais.includes('contornar_armadura'),grauAtaque:grade.grau,rolagemAtaque:die,valorAtaque:value});
      }
     }else{
      if(!locations.length)throw Error('O alvo não possui partes atingíveis.');
      const randomLocal=labLocalizacaoD20_().local,local=decision.local||(locations.includes(randomLocal)?randomLocal:locations[Math.floor(Math.random()*locations.length)]);
      damage=labAplicarDanoLocal_(target,incoming,item,{localForcada:local,ignorarArmadura:especiais.includes('contornar_armadura'),grauAtaque:grade.grau,rolagemAtaque:die,valorAtaque:value});
     }
    }else{
     target.combateLab=target.combateLab||{};target.combateLab.caido=true;
     const resistencia=labRolarResistenciaFerimento22_(target,{valorAtaque:value,grauAtaque:grade.grau,rolagemAtaque:die});
     if(!resistencia.passou){target.combateLab.inconsciente=true;const rounds=1+Math.floor(Math.random()*4);target.combateLab.unconsciousUntilRound=(map.combat?.round||0)+rounds;target.combateLab.unconsciousClock=novaCriarRelogio_(rounds*6000,map.combat);}
     damage={local:'Área',bruto:0,paEf:0,final:0,resistencia};
    }
    const props=String(item.propriedades||item.propriedadesAtaque||'').toLocaleLowerCase('pt-BR');
    const dst=(target.combateLab=target.combateLab||{});
    if(especiais.includes('desarmar')&&activeDefenderWeapon)dst.armaCaida={key:chaveArmaV125_(activeDefenderWeapon),nome:getNome(activeDefenderWeapon)||'Arma',idBanco:String(activeDefenderWeapon.idBanco||activeDefenderWeapon.id||''),imagem:String(activeDefenderWeapon.imagem||''),ts:Date.now()};
    if(especiais.includes('sangrar')){dst.sangrando=true;dst.sangramentoAtivo=true;}
    if(especiais.includes('derrubar')){dst.caido=true;dst.derrubado=true;}
    if(/sangr|bleed/.test(props))dst.sangramentoAtivo=true;
    if(/derrubar|knockdown|impacto/.test(props))dst.caido=true;
    if(/infecc|infect/.test(props))dst.infecciosoAtivo=true;
    if(/drenagem|drain/.test(props))actor.combateLab.pontosVidaDrenados=(Number(actor.combateLab.pontosVidaDrenados)||0)+Math.max(0,damage.final||0);
   }
   const attackText=actor.nome+' → '+target.nome+': '+getNome(per)+' · '+getNome(item)+' · '+ataqueDescricao+' · '+grade.grau+(grade.sorte?' · 🍀 Sorte':'');
   const defenseText=defense?'Defesa de '+target.nome+': '+defense.nome+' · '+novaDescreverTeste_(defense.base,defense.valor,defense.die,defense.modifiers)+' → '+defense.grau+(defense.sorte?' · 🍀 Sorte':'')+' · '+(hit?'superada':'evitou o ataque'):'';
   const weaponDamageText=weaponDamage?weaponDamage.nome+' · dano na arma '+weaponDamage.aplicado+' · PV '+weaponDamage.pvAtual+'/'+weaponDamage.pvMax+(weaponDamage.quebrada?' · INUTILIZÁVEL':'')+(weaponDamage.excesso>0?' · excesso '+weaponDamage.excesso+' → Braço Direito':''):'';
   const bodyDamageText=damage?damage.local+' · dano rolado '+damage.bruto+' · armadura efetiva '+damage.paEf+' · dano tomado '+damage.final+(damage.ferimento?' · '+damage.ferimento:''):'';
   const damageText=[weaponDamageText,bodyDamageText].filter(Boolean).join(' · ');
   const resistances=damage?.resistencia?Object.values(target.combateLab.resistenciaFerimentos?.[damage.local]||{}).filter(v=>v&&typeof v==='object'&&'roll' in v):[];
   if(damage?.resistencia&&!resistances.length)resistances.push(damage.resistencia);
   const resistanceText=resistances.map(r=>'Resistência: '+r.roll+'/'+r.valor+' → '+r.grau+(r.sorte?' · 🍀 Sorte':'')+' · '+(r.passou?'resistiu':'não resistiu')).join(' · ');
   const consequences=[healthB.morto?'Morto':healthB.inconsciente?'Inconsciente':'',healthB.incapacitado?'Incapacitado':'',damage?.stunTurnos?'Choque: '+damage.stunTurnos+' oportunidade(s)':''].filter(Boolean).join(' · ');
   const rearText=fromBack?`Ataque pelas costas${evasionActive?' · Evasão permite Esquiva':(options.some(o=>o.id==='natural:aparar-cauda')?' · Cauda disponível · Esquiva -20':' · Aparar indisponível · Esquiva -20')}`:'';
   const specialText=psi?psiCost+' PP · sem dano físico':especiais.length?'Efeito especial: '+especiais.map(id=>effectOptions.find(e=>e.id===id)?.nome||id).join(', '):critical?'Crítico: dano máximo':'';
   const message=[attackText,defenseText,rearText,specialText,damageText,resistanceText,consequences].filter(Boolean).join(' · ');
   return JSON.parse(JSON.stringify({defenseSpent:!!defense,targetSheetPatch,actors:{[a.id]:{...(psi?{psiSpent:Number(actor.psiSpent??psiInfo.psiSpent)+psiCost,psiMax:psiInfo.psiMax}:{}),luckPrepared:!!actor.luckPrepared,psiIntuition:0,combateLab:actor.combateLab,municaoLab:actor.municaoLab||{}},[b.id]:{luckPrepared:!!target.luckPrepared,psiAbsorption:target.psiAbsorption||0,combateLab:target.combateLab,municaoLab:target.municaoLab||{}}},facing:actorAttackFacing,event:{message,attackerMessage:[attackText,hit?'Atingiu o alvo':'Não atingiu',rearText,specialText,damageText].filter(Boolean).join(' · '),defenderMessage:[attackText,defenseText,rearText,specialText,damageText,resistanceText,consequences].filter(Boolean).join(' · '),specialEffects:especiais,weaponDamage,damage:damage?.final||0,grade:grade.grau,hit,fromBack,defense,resistances,item:{nome:getNome(item),categoria:item.categoria||'',familia:item.familia||'',tipo:item.tipo||''}}}));
  });}finally{Math.random=originalRandom;}
 };
 resolve.area=cone;
 resolve.targetSheetPath=targetSheetPath;
 return resolve;
}
async function novaDadosAcoes_(t){
 const c=await novaFicha_(t),snapshot={...t,charLab:structuredClone(c)};
 const valorDe=(per,graus=0)=>{const d=novaDetalharValorPericia_(c,snapshot,per,graus);return {valor:d.valor,base:d.raw,calculo:novaDescreverTesteAtaque_(d,null)};};
 const skills=(batalhaListaPericias_(c)||[]).map(per=>({
  id:batalhaTokenPericia_(per),nome:getNome(per),...valorDe(per),attack:periciaCriaturaPodeAtacar_(c,per),descricao:getDescricao(per)||'',
  weapons:novaEquipamentos_(c,per).map(w=>({id:w.valor,nome:w.rotulo,penalty:w.graus||0,...valorDe(per,w.graus||0),descricao:getDescricao(w.item)||'',dano:w.item?.dano||'',ammunition:labEhArmaMuniciada_(w.item)?{key:labChaveArma_(w.item),capacity:labCapacidadeArma_(w.item)}:null}))
 })).sort((a,b)=>b.valor-a.valor||a.nome.localeCompare(b.nome,'pt-BR'));
 const support=novaInfoSuporte_(c,t);
 return {skills,pvHtml:labResumoPVHtml_(snapshot,'SEUS PV'),health:labGarantirSnapshotCombate_(snapshot),support};
}
function novaInfoSuporte_(c,t){
 const snap={...t,__novaFicha:true,charLab:structuredClone(c)},inventory=structuredClone(normalizarInventario_(c)),kits=[];
 for(const comp of ['equipado','bolso','mochila'])for(const [index,item]of (inventory[comp]||[]).entries()){
  if(!item)continue;
  if(identificarKit(item)){
   const key=String(item.instanciaId||item.idBanco||item.id||'kit')+':'+comp+':'+index;const uses=Math.max(0,Number(item.usosRestantes??t.kitUses?.[key]??item.usos??item.cargas??5));kits.push({comp,index,key,uses,name:getNome(item)});
  }
 }
 const per=labPrimeirosSocorrosPericia_(snap),powers=labPsiPoderes_(snap).map(p=>({id:p.id,name:getNome(p),description:p.observacao||getDescricao(p)||'',durationSeconds:Number(p.duracaoSegundos||p.durationSeconds)||undefined,cost:Math.max(0,Number(p.custo)||0),range:Number(p.alcanceMetros)||20,value:Math.min(100,labPsiValor_(snap,p))}));
 return {luck:pontosSorteAtuais_(c),luckMax:pontosSorteMax_(c),firstAid:per?{value:novaValorPericia_(c,snap,per)}:null,health:labGarantirSnapshotCombate_(snap),inventory,kits,powers,psiMax:labPsiMax_(snap),psiSpent:Number(c.pontosMagiaGastos)||0};
}
async function novaPrepararSuporte_(a,b,tokens){
 const chars=new Map(await Promise.all(tokens.map(async t=>[t.id,await novaFicha_(t)])));
 const ca=chars.get(a.id),cb=chars.get(b.id),source=decodeURIComponent(a.id),sheetPath=source.startsWith('sync')||source.startsWith('dummy:')?null:(globalThis.mesaTreinoRotaV205?.('personagens/'+source)||'personagens/'+source);
 return {sheetPath,resolve:args=>{
  const {health,map,cmd}=args,sourceChar=args.sheet||ca,info=novaInfoSuporte_(sourceChar,{...a,...health.actors?.[a.id]}),targetInfo=novaInfoSuporte_(cb,{...b,...health.actors?.[b.id]});
  info.targetHealth=targetInfo.health;info.healthById={};info.willById={};info.dodgeById={};info.resistanceById={};
  for(const t of tokens){const c=chars.get(t.id),snap={...t,...structuredClone(health.actors?.[t.id]||{}),charLab:c},per=batalhaPericiaPorNomes_(c,['força de vontade','vontade','willpower']);info.healthById[t.id]=labGarantirSnapshotCombate_(snap);info.willById[t.id]=per?novaValorPericia_(c,snap,per):0;for(const [key,names]of [["dodgeById",["esquiva"]],["resistanceById",["resistência","resistencia"]]]){const p=batalhaPericiaPorNomes_(c,names);info[key][t.id]=p?(key==='resistanceById'?novaValorPericiaTotal_(c,p):novaValorPericia_(c,snap,p)):0;}}
  if(cmd.kind==='direct-inventory'){
   if(!args.sheet)throw Error('Ficha persistente não encontrada.');
   const result=moverInventario({...args,actor:health.actors?.[a.id],validarPeso:(inv,comp)=>validarPesoCompartimento_(sourceChar,inv,comp,false,pesoEfetivoCompartimento_(sourceChar,sourceChar.inventario||{},comp))});
   return {...result,actors:{...health.actors,[a.id]:{...health.actors?.[a.id],inventoryRevision:Number(health.actors?.[a.id]?.inventoryRevision||0)+1}}};
  }
  if(cmd.kind==='direct-extinguish')return apagarFogo({...args,info});
  if(cmd.kind==='direct-luck')return prepararSorte({...args,info});
  if(cmd.kind==='direct-consciousness'){if(emComaV134_(health.actors?.[a.id]?.combateLab))throw Error('Em coma: só acorda depois de Primeiros Socorros ou cura no ferimento grave.');return resolverConsciencia({...args,info,roll:novaSorteioSuporte_(args.seed)});}
  if(cmd.kind==='direct-psi-review'){
   const requests=structuredClone(health.psiRequests||[]),request=requests.find(r=>r.id===cmd.requestId&&r.status==='pending');if(!request)throw Error('Solicitação já resolvida.');
   request.status='resolved';request.answer=String(cmd.text||'').slice(0,2000);return {actors:health.actors,psiRequests:requests,eventActorId:request.actorId,eventTargetId:request.targetId,message:request.powerName+' · resposta do mestre: '+request.answer};
  }
  if(cmd.kind==='direct-stand'){
   const actors=structuredClone(health.actors||{}),s=actors[a.id];if(!s?.combateLab||s.combateLab.inconsciente||ocupado(s,map.combat))throw Error('Não pode levantar neste estado.');s.combateLab.caido=false;s.combateLab.derrubado=false;
   return {actors,combat:map.combat?.active?novaAcaoSuporte_(map.combat,'spend',map.combat.turnId):map.combat,message:a.nome+' levantou-se (1 Ação).'};
  }
  if(cmd.kind==='direct-test'){
   const actors=structuredClone(health.actors||{}),state=actors[a.id]||={combateLab:info.health};
   if(ocupado(state,map.combat)||state.combateLab.inconsciente||state.combateLab.morto)throw Error('Não pode testar perícias neste estado.');
   const per=(batalhaListaPericias_(sourceChar)||[]).find(p=>batalhaTokenPericia_(p)===cmd.skillId);if(!per)throw Error('Perícia não encontrada na ficha.');
   const value=novaValorPericia_(sourceChar,{...a,...state,supportRound:map.combat?.round||0,charLab:sourceChar,__novaFicha:true},per),r=testeComSorte(state,value,novaSorteioSuporte_(args.seed));state.psiIntuition=0;
   return {actors,combat:map.combat?.active?novaAcaoSuporte_(map.combat,'spend',map.combat.turnId):map.combat,message:a.nome+' · '+getNome(per)+': '+r.die+'/'+r.valor+' → '+r.grau+(r.sorte?' · 🍀 Sorte':'')};
  }
  const scene=args.scene?{...args.scene,objects:(args.scene.objects||[]).map(o=>{const modelId=String(o.modeloId||'').split(':').pop(),model=[...(objetosMapaDB||[]),...(itensDB||[])].find(m=>String(m.id)===modelId);return {...o,imagem:o.imagem||model?.imagem||''};})}:args.scene;
  const result=cmd.kind==='direct-first-aid'?resolverSocorros({...args,info}):resolverPsi({...args,scene,info});
  // Um paciente recuperado volta à ordem no próximo turno, sem ações gratuitas agora.
  const combat=result.combat,patient=result.actors?.[b.id]?.combateLab;
  if(combat?.active&&patient&&!patient.morto&&!patient.inconsciente&&!combat.order.includes(b.id)&&combat.rolls?.[b.id]){
   combat.order.push(b.id);combat.order.sort((x,y)=>combat.rolls[y].total-combat.rolls[x].total);combat.initial[b.id]={remaining:obterPAMaxCombate_(cb),passes:0};combat.actors[b.id]={remaining:0,passes:2};
  }
  return result;
 }};
}
import {acaoIniciativa as novaAcaoSuporte_} from './nova-turnos.js?v=46';
async function novaPrepararFogo_(tokens){
 const chars=new Map(await Promise.all(tokens.map(async t=>[t.id,await novaFicha_(t)])));
 return (positions,actors,exposures,map,random)=>{
  const messages=[],oldRandom=Math.random;Math.random=random;
  try{for(const e of exposures){const p=positions.find(t=>t.id===e.id);if(!p||!chars.has(p.id))continue;
   const a=actors[p.id]||={},t={...p,...structuredClone(a),charLab:structuredClone(chars.get(p.id)),supportRound:map.combat?.round||0};
   const state={...labEstado_,tokens:[t],objetosLab:[],log:[]};
   labComContextoLocal_(state,false,()=>{const st=labGarantirSnapshotCombate_(t);if(st.morto)return;
    const locs=Object.keys(st.hitMax||{}).filter(l=>Number(st.hit?.[l]??st.hitMax[l])>-Number(st.hitMax[l]));if(!locs.length)return;
    const local=locs[Math.floor(random()*locs.length)],d=labAplicarDanoLocal_(t,e.damage,{nome:'Incêndio'},{localForcada:local,ignorarArmadura:true});
    actors[p.id]={...a,combateLab:t.combateLab};messages.push({actorUid:p.donoUid||'',message:p.nome+' · Calor/incêndio: −'+d.final+' PV · '+local+(d.ferimento?' · '+d.ferimento:'')});
   });
  }}finally{Math.random=oldRandom;}return messages;
 };
}
let v102GroupLocation_={mapaId:'',cenarioId:'',atualizadoEm:''};
const novaSyncController_=mountDirectPositionLab({
 workshop:options=>window.novaOficinaMesa_(options),
 renderSceneObject:(o,scene)=>window.novaOficinaElemento_(o,scene),
 prepareFire:novaPrepararFogo_,
 user:()=>currentUserUid?{uid:String(currentUserUid),master:batalhaEhMestre_()}:null,
 characters:()=>userCharacters||[],
 activeCharacter:()=>currentCharId,
 viewActor:()=>window.mesaDiretorV206_||'',
 groupLocation:()=>v102GroupLocation_,
 catalog:()=>[
  ...(userCharacters||[]).filter(personagemAtivoCampanhaV102_).map(t=>({...t,catalogType:(t.donoUid||t.dono)===currentUserUid?'pm':'pj'})),
  ...(npcsDB||[]).filter(t=>t.selecionavelCombate!==false).map(t=>({...t,id:'syncnpc:'+t.id,catalogType:'npc',donoUid:'',dono:'',nome:'NPC · '+t.nome})),
  ...(criaturasDB||[]).filter(t=>t.selecionavelCombate!==false).map(t=>({...t,id:'synccriatura:'+t.id,catalogType:'monstro',donoUid:'',dono:'',nome:'Monstro · '+t.nome})),
  ...(objetosMapaDB||[]).map(t=>({...t,id:'syncobjeto:'+t.id,catalogType:'objeto'})),
  ...(itensDB||[]).map(t=>({...t,id:'syncitem:'+t.id,catalogType:'item'}))
 ],
 loadProp:async o=>{
  const id=o.modeloId.slice(o.modeloId.indexOf(':')+1);
  let model=o.tipo!=='item'?await map806BuscarModelo_(id):(itensDB||[]).find(t=>String(t.id)===id);
  if(!model&&o.tipo==='item'){const s=await getDoc(doc(db,'itens',id));if(s.exists())model=s.data();}
  return model||{};
 },
 loadActions:novaDadosAcoes_,
 prepareAttack:novaPrepararAtaque_,
 prepareSupport:novaPrepararSuporte_,
 playAttackSound:event=>{if(!tocarEfeito(obterAudioCtx_(),event.item)){labSomAtaque_(event.item,event.grade);if(event.damage>0)labSomDanoAplicado_(event.item);}},
 unlockSound:()=>obterAudioCtx_()?.resume(),
 restoreHealth:async tokens=>Object.fromEntries(await Promise.all(tokens.map(async t=>{const c=await novaFicha_(t),snapshot={...t,charLab:c};return labComContextoLocal_({...labEstado_,tokens:[snapshot]},false,()=>{labRestaurarTokenCompleto490_(snapshot);return [t.id,JSON.parse(JSON.stringify({combateLab:snapshot.combateLab,municaoLab:{}}))];});}))),
 rollTest:valor=>{const die=1+Math.floor(Math.random()*100);return {die,...classificarD100_(valor,die)};},
 mapas:()=>mapasDB||[],
 loadCombatants:async tokens=>Promise.all(tokens.map(async t=>{
  const c=await novaFicha_(t);
  const fatigue=obterRegraFadiga_(c);
  const int=(c.atributos?.INT||10)+(c.bonus?.INT||0),dex=(c.atributos?.DES||10)+(c.bonus?.DES||0);
  return {...t,...(c.__npcTemporario?{atributosIndividuo:structuredClone(c.atributos||{})}:{}),movementMax:deslocamentoFichaV112_(c,t.nome,t),initiative:Math.max(0,Math.ceil((int+dex)/2)+(fatigue.iniciativa||0)),actions:obterPAMaxCombate_(c)};
 })),
 renderMap:(map,options)=>window.novaSyncRenderMap_(map,options),
 loadMap:async id=>{
  let base=(mapasDB||[]).find(x=>String(x.id)===String(id));
  if(!base){const s=await getDoc(doc(db,'mapas',String(id)));base=s.exists()?{id:String(id),...s.data()}:null;}
  if(!base)throw new Error('Mapa não encontrado');
  const map=await labMapaHidratar_(base);
  const refs=[...(map.oficina2State?.elements||[]),...(map.objetos||[])];
  const ids=[...new Set(refs.map(e=>e.modeloId||e.objetoBancoId).filter(id=>id&&id!=='imagem_importada'))];
  await Promise.all(ids.map(id=>map806BuscarModelo_(id)));
  return map;
 },
 database:{
  get:async p=>{const s=await getDoc(doc(db,...p.split('/')));return s.exists()?mesaDecodificarAninhadosV205_(s.data()):null;},
  transact:fn=>runTransaction(db,async native=>fn({
   get:async p=>{const s=await native.get(doc(db,...p.split('/')));return s.exists()?mesaDecodificarAninhadosV205_(s.data()):null;},
   set:(p,v)=>native.set(doc(db,...p.split('/')),mesaCodificarAninhadosV205_(v)),
   delete:p=>native.delete(doc(db,...p.split('/')))
  })),
  writeMap:(p,v)=>setDoc(doc(db,...p.split('/')),mesaCodificarAninhadosV205_(v),{merge:true}),
  subscribeDoc:(p,receive,fail)=>onSnapshot(doc(db,...p.split('/')),{includeMetadataChanges:true},s=>receive(s.exists()?mesaDecodificarAninhadosV205_(s.data()):null),fail),
  subscribe:(p,receive,fail)=>onSnapshot(collection(db,...p.split('/')),{includeMetadataChanges:true},s=>{
   receive(s.docChanges({includeMetadataChanges:true}).filter(c=>!c.doc.metadata.hasPendingWrites).map(c=>({id:c.doc.id,data:mesaDecodificarAninhadosV205_(c.doc.data()),removed:c.type==='removed'})));
  },fail)
 }
});
window.novaSyncAbrir_=()=>{
    labSuspensoParaNova_=true;
    labTransport_?.close();labTransport_=null;
    clearInterval(labLeaseTimer_);labLeaseTimer_=null;
    labMapaMesaUnsub_?.();labMapaAcoesUnsub_?.();
    labMapaMesaUnsub_=null;labMapaAcoesUnsub_=null;
    return novaSyncController_.open();
};
window.novaSyncInicializar_=()=>novaSyncController_.initialize();
window.novaSyncController_=novaSyncController_; // módulos à parte (ex.: sessão v206) acessam o controlador por aqui

window.importarObjetosMapaCSV=async function(input){
 if(!batalhaEhMestre_()){notificar_('Apenas o mestre pode importar objetos.','aviso');input.value='';return;}
 const file=input.files?.[0];if(!file)return;
 Papa.parse(file,{header:true,skipEmptyLines:'greedy',transformHeader:h=>String(h).replace(/^\uFEFF/,'').trim(),complete:async results=>{
  try{
   if(results.errors.length)throw Error('CSV inválido: '+results.errors[0].message);
   const incoming=importarModelos(results.data,objetosMapaDB);if(!incoming.length)throw Error('O CSV está vazio.');
   if(incoming.length>450)throw Error('Importe até 450 modelos por arquivo.');
   const indexRef=doc(db,'configuracoes','objetosMapa');
   await runTransaction(db,async tx=>{
    const index=(await tx.get(indexRef)).data()||{},docs=await Promise.all(incoming.map(o=>tx.get(doc(db,'configuracoes',objetoMapaDocId_(o.id)))));
    const fresh=docs.map((d,i)=>({id:incoming[i].id,...(d.data()||{})}));
    const validated=importarModelos(results.data,[...objetosMapaDB.filter(o=>!incoming.some(n=>n.id===o.id)),...fresh]);
    for(const o of validated)tx.set(doc(db,'configuracoes',objetoMapaDocId_(o.id)),o);
    const ids=[...new Set([...(index.ids||[]),...(index.lista||[]).map(o=>o.id),...objetosMapaDB.map(o=>o.id),...validated.map(o=>o.id)])];
    tx.set(indexRef,{formato:'docs-v1',ids,atualizadoEm:new Date().toISOString()});
   });
   await carregarBancosDeDados();notificar_(incoming.length+' modelos importados. Os objetos já colocados mantêm seu estado.','sucesso',5000);
  }catch(e){notificar_('Não foi possível importar: '+e.message,'erro',7000);}finally{input.value='';}
 },error:e=>{input.value='';notificar_('Não foi possível ler o CSV: '+e.message,'erro');}});
};

